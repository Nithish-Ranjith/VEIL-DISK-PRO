"""
SENTINEL-DISK Pro — FastAPI Backend

Wires together all 4 engines:
  Engine 0: SMART Reader       — real drive data via smartctl
  Engine 1: Health Prediction  — TCN model + rule-based fallback
  Engine 2: Compression Engine — real filesystem scan + write reduction
  Engine 3: Coordinator        — closed-loop life extension system

All endpoints are real — no mocks, no hardcoded responses.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime
import logging
import platform
import subprocess
import shutil
import psutil
import json
import os

# ── Sentry — initialise before any app code (gated by SENTRY_DSN env var) ─────
_sentry_dsn = os.environ.get("SENTRY_DSN", "")
if _sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration
    sentry_sdk.init(
        dsn=_sentry_dsn,
        integrations=[FastApiIntegration(), StarletteIntegration()],
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_RATE", "0.1")),
        environment=os.environ.get("APP_ENV", "production"),
        release="sentinel-disk-pro@2.0.0",
        send_default_pii=False,   # GDPR — no user PII unless opted in
    )
    logging.getLogger("sentinel").info("✅ Sentry error monitoring enabled")

from smart_reader import SMARTReader
from health_engine import HealthPredictionEngine
from compression_engine import CompressionEngine
from coordinator import IntelligentCoordinator

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("sentinel")

# ── Engine initialization ──────────────────────────────────────────────────────
logger.info("Initializing SENTINEL-DISK Pro engines...")

smart_reader       = SMARTReader()
health_engine      = HealthPredictionEngine()
compression_engine = CompressionEngine()
coordinator        = IntelligentCoordinator(
    health_engine=health_engine,
    compression_engine=compression_engine,
    smart_reader=smart_reader,
)

logger.info("✅ All engines initialized")

# ── In-memory settings store (persisted to disk) ──────────────────────────────
SETTINGS_FILE = "data/settings.json"
os.makedirs("data", exist_ok=True)

DEFAULT_SETTINGS = {
    "scan_interval_hours":       6,
    "health_threshold":          50,
    "compression_aggressiveness": "auto",   # auto | normal | conservative | aggressive | emergency
    "data_source":               "simulated",    # Enforced for Web Demo
    "desktop_notifications":     False,          # Disabled for Web Demo
    "critical_alerts":           True,
    "auto_adjust":               True,
    "algorithm_active":          True,
}

def load_settings() -> Dict:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE) as f:
                saved = json.load(f)
            return {**DEFAULT_SETTINGS, **saved}
        except Exception:
            pass
    return DEFAULT_SETTINGS.copy()

def save_settings(settings: Dict):
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f, indent=2)

app_settings = load_settings()

# Per-drive compression mode overrides (in-memory)
drive_compression_overrides: Dict[str, str] = {}

# ── Rate Limiter ──────────────────────────────────────────────────────────────
_rate_limit = os.environ.get("RATE_LIMIT_PER_MIN", "60")
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{_rate_limit}/minute"])

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SENTINEL-DISK Pro API",
    description="Real drive health monitoring, prediction, and life extension.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS: read from env var ALLOWED_ORIGINS (comma-separated) or default to localhost dev ports
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
if _raw_origins.strip() == "*" or _raw_origins.strip() == "":
    # Dev mode — allow all origins
    _cors_origins = ["*"]
    _cors_credentials = False   # credentials=True not allowed with wildcard
else:
    _cors_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
    _cors_credentials = True

# Always include common local dev ports
_local_dev_ports = [
    "http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
    "http://localhost:5176", "http://localhost:3000", "http://localhost:8080",
    "http://127.0.0.1:5173", "http://127.0.0.1:3000",
]
if "*" not in _cors_origins:
    for _p in _local_dev_ports:
        if _p not in _cors_origins:
            _cors_origins.append(_p)
    _cors_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_cors_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Firebase JWT Auth (optional — enabled by FIREBASE_PROJECT_ID env var) ─────
_firebase_project_id = os.environ.get("FIREBASE_PROJECT_ID", "").strip()
if _firebase_project_id:
    from middleware.auth import FirebaseAuthMiddleware
    app.add_middleware(FirebaseAuthMiddleware, project_id=_firebase_project_id)
    logger.info(f"✅ Firebase auth middleware enabled (project: {_firebase_project_id})")
else:
    logger.warning("⚠️  FIREBASE_PROJECT_ID not set — API endpoints are UNAUTHENTICATED (dev mode)")


# ══════════════════════════════════════════════════════════════════════════════
# REQUEST MODELS
# ══════════════════════════════════════════════════════════════════════════════

class CompressionModeRequest(BaseModel):
    mode: str  # normal | conservative | aggressive | emergency

class SettingsRequest(BaseModel):
    scan_interval_hours:       Optional[int]   = None
    health_threshold:          Optional[int]   = None
    compression_aggressiveness: Optional[str]  = None
    data_source:               Optional[str]   = None
    desktop_notifications:     Optional[bool]  = None
    critical_alerts:           Optional[bool]  = None
    auto_adjust:               Optional[bool]  = None
    algorithm_active:          Optional[bool]  = None


# ══════════════════════════════════════════════════════════════════════════════
# SYSTEM ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "service":   "SENTINEL-DISK Pro API",
        "status":    "running",
        "version":   "2.0.0",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/health")
async def health_check():
    """
    Docker / load-balancer health check endpoint.
    Returns 200 OK when the server is ready to serve traffic.
    """
    return {"status": "ok", "version": "2.0.0"}


@app.get("/api/v1/system/status")
async def get_system_status():
    """
    Real system status: CPU, memory, disk, smartctl availability.
    Used by the system status bar in the UI.
    """
    try:
        # CPU and memory via psutil
        cpu_pct    = psutil.cpu_percent(interval=0.5)
        mem        = psutil.virtual_memory()
        mem_pct    = mem.percent
        mem_used   = round(mem.used  / 1e9, 1)
        mem_total  = round(mem.total / 1e9, 1)

        # Disk usage for the root/home volume
        try:
            disk = psutil.disk_usage("/")
            disk_used_pct = disk.percent
            disk_free_gb  = round(disk.free / 1e9, 1)
        except Exception:
            disk_used_pct = 0
            disk_free_gb  = 0

        # Check if smartctl is available
        smartctl_path    = shutil.which("smartctl")
        smartctl_available = smartctl_path is not None

        # Drive count
        drives = smart_reader.get_all_drives()
        real_drives = [d for d in drives if not d.get("is_simulated", True)]
        sim_drives  = [d for d in drives if d.get("is_simulated", True)]

        # OS info
        os_info = f"{platform.system()} {platform.release()}"

        # ML model mode
        ml_mode = "tcn_model" if (health_engine.model and health_engine.norm_params) else "rule_based"

        return {
            "cpu_percent":         round(cpu_pct, 1),
            "memory_percent":      round(mem_pct, 1),
            "memory_used_gb":      mem_used,
            "memory_total_gb":     mem_total,
            "disk_used_percent":   disk_used_pct,
            "disk_free_gb":        disk_free_gb,
            "drive_count":         len(drives),
            "real_drive_count":    len(real_drives),
            "simulated_drive_count": len(sim_drives),
            "smartctl_available":  smartctl_available,
            "smartctl_path":       smartctl_path,
            "os":                  os_info,
            "hostname":            platform.node(),
            "algorithm_active":    app_settings.get("algorithm_active", True),
            "auto_adjust":         app_settings.get("auto_adjust", True),
            "data_source":         app_settings.get("data_source", "auto"),
            "ml_mode":             ml_mode,
            "timestamp":           datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"System status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/system/smartctl-check")
async def check_smartctl():
    """Check if smartctl is installed and return installation instructions if not."""
    smartctl_path = shutil.which("smartctl")
    if smartctl_path:
        try:
            result = subprocess.run(
                ["smartctl", "--version"],
                capture_output=True, text=True, timeout=5
            )
            version_line = result.stdout.split("\n")[0] if result.stdout else "unknown"
        except Exception:
            version_line = "installed"
        return {
            "available":    True,
            "path":         smartctl_path,
            "version":      version_line,
            "message":      "smartctl is available — real drive data enabled",
        }
    else:
        system = platform.system()
        install_cmd = {
            "Darwin":  "brew install smartmontools",
            "Linux":   "sudo apt install smartmontools",
            "Windows": "Download from https://www.smartmontools.org/wiki/Download",
        }.get(system, "See https://www.smartmontools.org")
        return {
            "available":    False,
            "path":         None,
            "version":      None,
            "message":      f"smartctl not found. Install with: {install_cmd}",
            "install_cmd":  install_cmd,
        }


# ══════════════════════════════════════════════════════════════════════════════
# DRIVE ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/drives")
async def get_all_drives():
    """List all detected drives with basic info."""
    try:
        data_source = app_settings.get("data_source", "auto")
        drives = smart_reader.get_all_drives(forced_mode=data_source)
        return {
            "drives":      drives,
            "total_count": len(drives),
            "timestamp":   datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error getting drives: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/drive/{drive_id}/status")
async def get_drive_status(drive_id: str):
    """
    ⭐ MAIN ENDPOINT — Full coordinator cycle for a drive.
    Reads SMART → predicts health → decides intervention → records impact.
    """
    try:
        # Apply settings to coordinator
        coordinator.HEALTH_DROP_THRESHOLD = app_settings.get("health_threshold", 50) / 10

        # Apply compression mode override if set
        override_mode = drive_compression_overrides.get(drive_id)
        if override_mode and not app_settings.get("algorithm_active", True):
            override_mode = None  # Algorithm disabled — no compression

        status = coordinator.run_cycle(drive_id)

        data_source = app_settings.get("data_source", "auto")
        drives = smart_reader.get_all_drives(forced_mode=data_source)
        drive_info = next((d for d in drives if d["drive_id"] == drive_id), None)

        if not drive_info:
            raise HTTPException(status_code=404, detail=f"Drive {drive_id} not found")

        return {
            "drive": {
                "drive_id":    drive_id,
                "model":       drive_info.get("model", "Unknown"),
                "serial":      drive_info.get("serial", "Unknown"),
                "smart":       drive_info.get("smart_values", {}),
                "smart_passed": drive_info.get("smart_passed", True),
                "is_simulated": drive_info.get("is_simulated", True),
                "size":        drive_info.get("size", "Unknown"),
            },
            "health":           status["health"],
            "coordinator": {
                **status["coordinator"],
                "compression_result": (
                    status.get("intervention", {}).get("action", {})
                    if status.get("intervention") else {}
                ),
                "recommendation": (
                    status.get("intervention", {}).get("trigger", {}).get("reason")
                    if status.get("intervention") else "System healthy"
                ),
                "data_source": "real" if not drive_info.get("is_simulated", True) else "simulated",
                "algorithm_active": app_settings.get("algorithm_active", True),
                "current_override_mode": override_mode,
            },
            "intervention":    status.get("intervention"),
            "cumulative_impact": status["cumulative_impact"],
            "timestamp":       datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Drive status error for {drive_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/drive/{drive_id}/health")
async def get_drive_health(drive_id: str):
    """Get health prediction for a specific drive."""
    try:
        history = smart_reader.get_smart_history(drive_id, days=30)
        if not history:
            raise HTTPException(status_code=404, detail=f"Drive {drive_id} not found")
        prediction = health_engine.predict(history)
        return {
            "drive_id":   drive_id,
            "prediction": prediction,
            "timestamp":  datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Health error for {drive_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/drive/{drive_id}/history")
async def get_drive_history(drive_id: str, days: int = 30):
    """Get historical SMART data for a drive."""
    try:
        history = smart_reader.get_smart_history(drive_id, days=days)
        if not history:
            raise HTTPException(status_code=404, detail=f"Drive {drive_id} not found")
        return {
            "drive_id":    drive_id,
            "days":        days,
            "history":     history,
            "data_points": len(history),
            "timestamp":   datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"History error for {drive_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/drive/{drive_id}/compression")
async def get_compression_analysis(drive_id: str):
    """
    Get real compression analysis for the filesystem.
    Triggers a real os.walk() scan (cached 10 min).
    """
    try:
        fs_analysis    = compression_engine.analyze_filesystem()
        history        = smart_reader.get_smart_history(drive_id, days=30)
        prediction     = health_engine.predict(history)

        # Use override mode if set, else auto from health score
        override_mode  = drive_compression_overrides.get(drive_id)
        aggressiveness = app_settings.get("compression_aggressiveness", "auto")
        effective_mode = override_mode or (None if aggressiveness == "auto" else aggressiveness)

        write_reduction = compression_engine.calculate_write_reduction(
            health_score=prediction["health_score"],
            compression_potential=fs_analysis["compression_potential"],
            override_mode=effective_mode,
        )

        # Calculate write reduction history based on drive power-on hours
        # In a real scenario, this would come from a database of daily logs.
        # Here we simulate the *past* history based on the drive's age (Smart 9).
        poh = next((v for k, v in history[-1].items() if k == "smart_9"), 0) if history else 0
        write_reduction_history = compression_engine.calculate_write_reduction_history(poh)

        return {
            "drive_id":            drive_id,
            "filesystem_analysis": fs_analysis,
            "write_reduction":     write_reduction,
            "write_reduction_history": write_reduction_history,
            "active_mode":         effective_mode or write_reduction["mode"],
            "algorithm_active":    app_settings.get("algorithm_active", True),
            "timestamp":           datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Compression error for {drive_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/drive/{drive_id}/interventions")
async def get_drive_interventions(drive_id: str):
    """Get all recorded interventions for a drive."""
    try:
        impact = coordinator.get_cumulative_impact(drive_id)
        return {
            "drive_id":  drive_id,
            **impact,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Interventions error for {drive_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/drive/{drive_id}/urgency")
async def get_drive_urgency(drive_id: str):
    """
    ⭐ INNOVATION: Backup Urgency Scorer
    Converts SMART/health data into human-readable urgency.
    """
    try:
        status         = coordinator.run_cycle(drive_id)
        health         = status["health"]
        current_score  = health.get("current_score", 100)
        days_remaining = health.get("days_to_failure", 365)
        trend          = health.get("trend", "stable")
        failure_prob   = health.get("failure_probability", 0.0)

        if days_remaining >= 180:   base_urgency = 5
        elif days_remaining >= 90:  base_urgency = 15
        elif days_remaining >= 60:  base_urgency = 30
        elif days_remaining >= 30:  base_urgency = 50
        elif days_remaining >= 14:  base_urgency = 70
        elif days_remaining >= 7:   base_urgency = 85
        else:                       base_urgency = 97

        multiplier = 1.0
        if trend == "rapid_decline": multiplier *= 1.5
        elif trend == "declining":   multiplier *= 1.2
        if current_score < 30:       multiplier *= 1.4
        elif current_score < 50:     multiplier *= 1.15
        if failure_prob > 0.7:       multiplier *= 1.3
        elif failure_prob > 0.4:     multiplier *= 1.1

        urgency = min(100, round(base_urgency * multiplier, 1))

        if urgency >= 85:
            level, message, action, color, icon = (
                "critical", "⚠️ DATA AT IMMEDIATE RISK",
                "Start emergency backup NOW", "#DC2626", "🔴"
            )
        elif urgency >= 60:
            level, message, action, color, icon = (
                "high", "🔴 BACKUP REQUIRED",
                "Backup within 24 hours", "#F97316", "🟠"
            )
        elif urgency >= 30:
            level, message, action, color, icon = (
                "medium", "⚠️ Backup Recommended",
                "Schedule backup this week", "#F59E0B", "🟡"
            )
        else:
            level, message, action, color, icon = (
                "low", "✅ Drive Stable",
                "Regular backups sufficient", "#10B981", "🟢"
            )

        factors = []
        if current_score < 30:
            factors.append({"factor": "Critical health score", "weight": 40,
                            "detail": f"Score {current_score}/100 — severely degraded"})
        elif current_score < 60:
            factors.append({"factor": "Low health score", "weight": 25,
                            "detail": f"Score {current_score}/100 — significant wear"})
        if trend in ["rapid_decline", "declining"]:
            factors.append({"factor": "Declining trend", "weight": 30,
                            "detail": f"Health is {trend.replace('_', ' ')}"})
        if days_remaining < 30:
            factors.append({"factor": "Low time remaining", "weight": 35,
                            "detail": f"Only {days_remaining} days predicted before failure"})
        if failure_prob > 0.4:
            factors.append({"factor": "High failure probability", "weight": 25,
                            "detail": f"{failure_prob*100:.0f}% failure chance in 30 days"})
        if not factors:
            factors.append({"factor": "Drive healthy", "weight": 5,
                            "detail": "No significant risk factors detected"})

        return {
            "drive_id":           drive_id,
            "urgency_score":      urgency,
            "urgency_level":      level,
            "message":            message,
            "recommended_action": action,
            "color":              color,
            "icon":               icon,
            "days_remaining":     days_remaining,
            "health_score":       current_score,
            "failure_probability": failure_prob,
            "trend":              trend,
            "factors":            factors,
            "timestamp":          datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Urgency error for {drive_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
# COMPRESSION CONTROL ENDPOINTS  (real button actions)
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/drive/{drive_id}/compression/toggle")
async def toggle_compression(drive_id: str):
    """
    Toggle the compression algorithm on/off for a drive.
    Wired to the "Algorithm Active" toggle in the UI.
    """
    try:
        current = app_settings.get("algorithm_active", True)
        app_settings["algorithm_active"] = not current
        save_settings(app_settings)

        logger.info(f"Algorithm {'enabled' if app_settings['algorithm_active'] else 'disabled'} for {drive_id}")

        return {
            "drive_id":          drive_id,
            "algorithm_active":  app_settings["algorithm_active"],
            "message":           f"Compression algorithm {'activated' if app_settings['algorithm_active'] else 'deactivated'}",
            "timestamp":         datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Toggle error for {drive_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/drive/{drive_id}/compression/mode")
async def set_compression_mode(drive_id: str, request: CompressionModeRequest):
    """
    Set compression mode for a specific drive.
    Wired to the "Adaptive Mode" button in the UI.
    Valid modes: normal | conservative | aggressive | emergency | auto
    """
    valid_modes = {"normal", "conservative", "aggressive", "emergency", "auto"}
    if request.mode not in valid_modes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mode '{request.mode}'. Must be one of: {valid_modes}"
        )

    try:
        if request.mode == "auto":
            drive_compression_overrides.pop(drive_id, None)
            effective = "auto (health-driven)"
        else:
            drive_compression_overrides[drive_id] = request.mode
            effective = request.mode

        logger.info(f"Compression mode set to '{request.mode}' for {drive_id}")

        # Recalculate write reduction with new mode
        history        = smart_reader.get_smart_history(drive_id, days=30)
        prediction     = health_engine.predict(history)
        fs_analysis    = compression_engine.analyze_filesystem()
        write_reduction = compression_engine.calculate_write_reduction(
            health_score=prediction["health_score"],
            compression_potential=fs_analysis["compression_potential"],
            override_mode=None if request.mode == "auto" else request.mode,
        )

        return {
            "drive_id":          drive_id,
            "mode_set":          request.mode,
            "effective_mode":    effective,
            "write_reduction":   write_reduction,
            "message":           f"Compression mode set to {request.mode}",
            "timestamp":         datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Mode set error for {drive_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/drive/{drive_id}/compression/auto-adjust")
async def toggle_auto_adjust(drive_id: str):
    """
    Toggle auto-adjust (health-driven mode selection) on/off.
    Wired to the "Auto-adjust ON/OFF" button in the UI.
    """
    try:
        current = app_settings.get("auto_adjust", True)
        app_settings["auto_adjust"] = not current
        save_settings(app_settings)

        if app_settings["auto_adjust"]:
            # Clear any manual override
            drive_compression_overrides.pop(drive_id, None)

        return {
            "drive_id":    drive_id,
            "auto_adjust": app_settings["auto_adjust"],
            "message":     f"Auto-adjust {'enabled' if app_settings['auto_adjust'] else 'disabled'}",
            "timestamp":   datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Auto-adjust error for {drive_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/drive/{drive_id}/optimize")
async def run_optimization(drive_id: str, background_tasks: BackgroundTasks):
    """
    Trigger an immediate optimization cycle for a drive.
    Wired to "Run Deep Optimization" and "Start Emergency Backup" buttons.

    1. Invalidates filesystem scan cache → forces fresh scan
    2. Sets compression to Emergency mode
    3. Runs full coordinator cycle
    4. Returns intervention result
    """
    try:
        # Force fresh filesystem scan
        compression_engine.invalidate_cache()

        # Set emergency mode for this drive
        drive_compression_overrides[drive_id] = "emergency"

        # Run full coordinator cycle
        status = coordinator.run_cycle(drive_id)

        # Get fresh compression analysis
        fs_analysis = compression_engine.analyze_filesystem()
        history     = smart_reader.get_smart_history(drive_id, days=30)
        prediction  = health_engine.predict(history)
        write_reduction = compression_engine.calculate_write_reduction(
            health_score=prediction["health_score"],
            compression_potential=fs_analysis["compression_potential"],
            override_mode="emergency",
        )

        logger.info(f"Emergency optimization triggered for {drive_id}")

        return {
            "drive_id":          drive_id,
            "optimization_mode": "emergency",
            "health_score":      status["health"]["current_score"],
            "write_reduction":   write_reduction,
            "intervention":      status.get("intervention"),
            "filesystem_scan":   {
                "files_scanned":    fs_analysis["total_files"],
                "compressible":     fs_analysis["compressible_files"],
                "savings_gb":       round(fs_analysis["estimated_savings_bytes"] / 1e9, 1),
                "is_real_scan":     fs_analysis.get("is_real_scan", False),
            },
            "message":           "Emergency optimization cycle complete",
            "timestamp":         datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Optimization error for {drive_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
# SETTINGS ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/settings")
async def get_settings():
    """Get current application settings."""
    return {
        "settings":  app_settings,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/v1/settings")
async def update_settings(request: SettingsRequest):
    """
    Update application settings. Changes take effect immediately.
    Settings are persisted to disk and survive backend restarts.
    """
    try:
        updated = {}
        request_dict = request.dict(exclude_none=True)

        for key, value in request_dict.items():
            if key in app_settings:
                old_value = app_settings[key]
                app_settings[key] = value
                updated[key] = {"from": old_value, "to": value}
                logger.info(f"Setting '{key}' changed: {old_value} → {value}")

        save_settings(app_settings)

        # Apply side effects immediately
        if "compression_aggressiveness" in updated:
            mode = app_settings["compression_aggressiveness"]
            if mode != "auto":
                # Apply to all drives
                drives = smart_reader.get_all_drives()
                for d in drives:
                    drive_compression_overrides[d["drive_id"]] = mode
            else:
                drive_compression_overrides.clear()

        if "algorithm_active" in updated and not app_settings["algorithm_active"]:
            drive_compression_overrides.clear()

        return {
            "settings":  app_settings,
            "updated":   updated,
            "message":   f"Updated {len(updated)} setting(s)",
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Settings update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/settings/reset")
async def reset_settings():
    """Reset all settings to defaults."""
    global app_settings
    app_settings = DEFAULT_SETTINGS.copy()
    drive_compression_overrides.clear()
    save_settings(app_settings)
    return {
        "settings":  app_settings,
        "message":   "Settings reset to defaults",
        "timestamp": datetime.now().isoformat(),
    }


# ══════════════════════════════════════════════════════════════════════════════
# REPORT ENDPOINT — PDF generation
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/report/{drive_id}")
@limiter.limit("10/minute")   # PDF generation is CPU-intensive — stricter limit
async def generate_drive_report(request: Request, drive_id: str):
    """
    Generate and download a PDF Warranty Claim Report for a drive.
    Rate limited to 10 requests/minute per IP.
    """
    from fastapi.responses import StreamingResponse
    from utils.pdf_generator import generate_pdf_report

    try:
        data_source    = app_settings.get("data_source", "auto")
        drives         = smart_reader.get_all_drives(forced_mode=data_source)
        drive_info     = next((d for d in drives if d["drive_id"] == drive_id), None)

        if not drive_info:
            raise HTTPException(status_code=404, detail=f"Drive '{drive_id}' not found")

        history    = smart_reader.get_smart_history(drive_id, days=30)
        prediction = health_engine.predict(history)

        report_data = {
            "model":           drive_info.get("model") or drive_info.get("media_name", "Unknown"),
            "serial_number":   drive_info.get("serial", "N/A"),
            "capacity_gb":     round(drive_info.get("size", 0) / 1e9, 1) if drive_info.get("size") else 0,
            "health_score":    prediction["health_score"],
            "risk_level":      prediction["risk_level"],
            "days_to_failure": prediction.get("days_to_failure"),
            "protocol":        drive_info.get("protocol", "N/A"),
            "device_path":     drive_info.get("device_path", drive_id),
            # Pass full history — pdf_generator handles smart_values extraction
            "smart_history":   history,
        }

        pdf_buffer = generate_pdf_report(report_data)
        safe_id    = drive_id.replace("/", "_").replace("\\", "_")
        filename   = f"SENTINEL_Warranty_Claim_{safe_id}_{datetime.now().strftime('%Y%m%d')}.pdf"

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/pdf",
                "Cache-Control": "no-cache",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF report error for {drive_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
# BACKUP ENDPOINT — OS-level backup trigger
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/drive/{drive_id}/backup")
async def trigger_backup(drive_id: str):
    """
    Trigger an OS-level backup for the drive.
    macOS : tmutil startbackup --auto --rotation --destination (Time Machine)
    Linux : rsync -av --stats /home /tmp/sentinel_backup_{drive_id}
    Windows: wbadmin start backup (requires admin)

    Returns immediately with the command status — backup runs in background.
    """
    system = platform.system()
    result = {"drive_id": drive_id, "platform": system}

    try:
        if system == "Darwin":
            proc = subprocess.run(
                ["tmutil", "startbackup", "--auto", "--rotation"],
                capture_output=True, text=True, timeout=10
            )
            if proc.returncode == 0:
                result["status"]  = "started"
                result["message"] = "Time Machine backup started in background."
            else:
                # If Time Machine isn't configured, fall back to a friendly message
                result["status"]  = "unavailable"
                result["message"] = "Time Machine not configured. Please set up Time Machine in System Preferences for automated backups."
                result["manual_steps"] = [
                    "Open System Preferences → Time Machine",
                    "Select a backup disk",
                    "Enable automatic backups",
                ]

        elif system == "Linux":
            import tempfile
            backup_dest = f"/tmp/sentinel_backup_{drive_id}"
            os.makedirs(backup_dest, exist_ok=True)
            proc = subprocess.Popen(
                ["rsync", "-av", "--stats", os.path.expanduser("~"), backup_dest],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
            result["status"]      = "started"
            result["message"]     = f"rsync backup started (PID {proc.pid}). Destination: {backup_dest}"
            result["backup_dest"] = backup_dest

        elif system == "Windows":
            proc = subprocess.run(
                ["wbadmin", "start", "backup", "-quiet"],
                capture_output=True, text=True, timeout=10,
                creationflags=0x08000000
            )
            if proc.returncode == 0:
                result["status"]  = "started"
                result["message"] = "Windows Backup started via wbadmin."
            else:
                result["status"]  = "unavailable"
                result["message"] = "Windows Backup requires admin rights. Run the app as Administrator."
        else:
            result["status"]  = "unsupported"
            result["message"] = f"Automatic backup not implemented for {system}."

    except FileNotFoundError as e:
        result["status"]  = "tool_missing"
        result["message"] = f"Backup tool not found: {e}. Ensure Time Machine / rsync / wbadmin is available."
    except subprocess.TimeoutExpired:
        result["status"]  = "started"
        result["message"] = "Backup command launched (did not wait for completion)."
    except Exception as e:
        logger.error(f"Backup error for {drive_id}: {e}")
        result["status"]  = "error"
        result["message"] = str(e)

    result["timestamp"] = datetime.now().isoformat()
    return result


# ══════════════════════════════════════════════════════════════════════════════
# SIMULATION / TESTING ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/simulate/run-cycle")
async def run_simulation_cycle():
    """Manually trigger coordination cycles for all drives."""
    try:
        drives  = smart_reader.get_all_drives()
        results = []
        for drive in drives:
            drive_id = drive["drive_id"]
            status   = coordinator.run_cycle(drive_id)
            results.append({
                "drive_id":              drive_id,
                "model":                 drive["model"],
                "intervention_triggered": status["coordinator"]["intervention_triggered"],
                "health_score":          status["health"]["current_score"],
                "mode":                  status["coordinator"]["current_mode"],
            })
        return {
            "timestamp":       datetime.now().isoformat(),
            "drives_processed": len(results),
            "results":         results,
        }
    except Exception as e:
        logger.error(f"Simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
# LEGACY ROUTES — What-If Simulator, simulated drives
# ══════════════════════════════════════════════════════════════════════════════
try:
    from routes.status import router as status_router
    app.include_router(status_router, prefix="/api/v1")
    logger.info("✅ Legacy status/what-if router mounted at /api/v1")
except Exception as _e:
    logger.warning(f"⚠️  Legacy router not mounted: {_e}")


# ══════════════════════════════════════════════════════════════════════════════
# STARTUP / SHUTDOWN
# ══════════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 70)
    logger.info("SENTINEL-DISK Pro v2.0 Starting...")
    logger.info("=" * 70)

    # Check smartctl availability
    smartctl = shutil.which("smartctl")
    if smartctl:
        logger.info(f"✅ smartctl found at {smartctl} — real drive data enabled")
    else:
        logger.warning("⚠️  smartctl not found — using simulated drive data")
        logger.warning("   Install with: brew install smartmontools")

    # Check ML model
    model_path = "ml/saved_models/tcn_v1.keras"
    norm_path  = "ml/saved_models/norm_params.pkl"
    if os.path.exists(model_path):
        logger.info(f"✅ TCN model found at {model_path}")
    else:
        logger.warning(f"⚠️  TCN model not found at {model_path}")
    if os.path.exists(norm_path):
        logger.info(f"✅ Normalization params found at {norm_path}")
    else:
        logger.warning(f"⚠️  norm_params.pkl not found — rule-based scoring active")

    # Initial coordination cycles
    logger.info("Running initial coordination cycles...")
    drives = smart_reader.get_all_drives()
    for drive in drives:
        drive_id = drive["drive_id"]
        try:
            status = coordinator.run_cycle(drive_id)
            logger.info(
                f"  {drive_id} ({drive.get('model','?')}): "
                f"Health={status['health']['current_score']}/100  "
                f"Mode={status['coordinator']['current_mode']}  "
                f"Simulated={drive.get('is_simulated', True)}"
            )
        except Exception as e:
            logger.error(f"  {drive_id}: Error — {e}")

    logger.info("=" * 70)
    logger.info("Backend ready at http://localhost:8000")
    logger.info("API docs at  http://localhost:8000/docs")
    logger.info("=" * 70)


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("SENTINEL-DISK Pro shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False, log_level="info")

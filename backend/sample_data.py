"""
SENTINEL-DISK Pro — Sample Data Module

Pre-populated realistic data for 3 demo drives at different health levels:
- Drive A: Healthy (score 92, low risk)
- Drive B: Warning (score 68, medium risk)
- Drive C: Critical (score 34, critical risk with active optimization)

Each drive includes 30 days of SMART history, compression stats,
and life extension timeline data.
"""

import random
import math
from datetime import datetime, timedelta

random.seed(42)

BASE_DATE = datetime(2026, 2, 20)


def _generate_smart_history(base_values, degradation_rates, days=30):
    """Generate realistic SMART history with gradual degradation and noise."""
    history = []
    for day in range(days):
        ts = (BASE_DATE - timedelta(days=days - 1 - day)).isoformat() + "Z"
        entry = {"timestamp": ts}
        for attr, base_val in base_values.items():
            rate = degradation_rates.get(attr, 0)
            noise = random.gauss(0, max(0.5, abs(base_val * 0.02)))
            value = base_val + rate * day + noise
            if attr in ("smart_5", "smart_187", "smart_188", "smart_197", "smart_198", "smart_12"):
                value = max(0, int(round(value)))
            elif attr == "smart_194":
                value = round(max(20, min(65, value)), 1)
            elif attr == "smart_9":
                value = max(0, int(round(value)))
            entry[attr] = value
        history.append(entry)
    return history


# ─── Drive A: Healthy ─────────────────────────────────────────────────────────

DRIVE_A = {
    "drive_id": "DRIVE_A_HEALTHY",
    "name": "Seagate Barracuda 4TB",
    "model": "ST4000DM004",
    "serial_number": "ZFN0A1BC",
    "capacity_gb": 4000,
    "health_score": 92,
    "risk_level": "Low",
    "days_to_failure": None,
    "confidence_interval": None,
    "failure_probability": 0.03,
    "optimization_active": False,
    "write_reduction": 0.0,
    "life_extended_days": 0,
    "smart_history": _generate_smart_history(
        base_values={
            "smart_5": 0, "smart_187": 0, "smart_188": 0,
            "smart_197": 0, "smart_198": 0, "smart_194": 35,
            "smart_9": 11800, "smart_12": 295
        },
        degradation_rates={
            "smart_9": 8, "smart_12": 0.5, "smart_194": 0.05
        }
    ),
    "health_history": [
        {"date": (BASE_DATE - timedelta(days=29-i)).isoformat()[:10],
         "score": round(93 + random.gauss(0, 0.5), 1)}
        for i in range(30)
    ],
    "compression_stats": {
        "total_files": 142350,
        "compressed_files": 12400,
        "total_size_gb": 2847.3,
        "compressed_size_gb": 2801.1,
        "space_saved_gb": 46.2,
        "by_file_type": [
            {"type": "Documents", "original_gb": 120.5, "compressed_gb": 85.2, "saved_gb": 35.3},
            {"type": "Code/Text", "original_gb": 45.8, "compressed_gb": 38.5, "saved_gb": 7.3},
            {"type": "Images", "original_gb": 890.2, "compressed_gb": 887.0, "saved_gb": 3.2},
            {"type": "Videos", "original_gb": 1450.0, "compressed_gb": 1450.0, "saved_gb": 0.0},
            {"type": "Databases", "original_gb": 52.3, "compressed_gb": 51.9, "saved_gb": 0.4},
            {"type": "Other", "original_gb": 288.5, "compressed_gb": 288.5, "saved_gb": 0.0}
        ],
        "write_ops_history": [
            {"date": (BASE_DATE - timedelta(days=29-i)).isoformat()[:10],
             "writes_before": random.randint(8000, 12000),
             "writes_after": random.randint(7500, 11500)}
            for i in range(30)
        ],
        "recommendations": [
            {"action": "Compress log files in /var/log", "potential_savings_gb": 8.2, "file_count": 340},
            {"action": "Optimize PNG images in ~/Photos", "potential_savings_gb": 2.1, "file_count": 1250},
            {"action": "Compress old project archives", "potential_savings_gb": 15.4, "file_count": 28}
        ]
    },
    "life_extension": {
        "interventions": [],
        "total_days_extended": 0,
        "baseline_remaining_days": None,
        "current_remaining_days": None
    }
}

# ─── Drive B: Warning ─────────────────────────────────────────────────────────

_drive_b_health = []
_score_b = 75.0
for i in range(30):
    _score_b -= random.uniform(0.1, 0.4)
    _drive_b_health.append({
        "date": (BASE_DATE - timedelta(days=29-i)).isoformat()[:10],
        "score": round(_score_b, 1)
    })

DRIVE_B = {
    "drive_id": "DRIVE_B_WARNING",
    "name": "WD Blue 2TB",
    "model": "WDC WD20EZRZ",
    "serial_number": "WD-WMC4N0E3R1PX",
    "capacity_gb": 2000,
    "health_score": 68,
    "risk_level": "Medium",
    "days_to_failure": 75,
    "confidence_interval": {"lower": 63, "upper": 87},
    "failure_probability": 0.38,
    "optimization_active": True,
    "write_reduction": 0.28,
    "life_extended_days": 4,
    "smart_history": _generate_smart_history(
        base_values={
            "smart_5": 8, "smart_187": 1, "smart_188": 0,
            "smart_197": 1, "smart_198": 0, "smart_194": 40,
            "smart_9": 27500, "smart_12": 630
        },
        degradation_rates={
            "smart_5": 0.25, "smart_187": 0.05, "smart_197": 0.08,
            "smart_9": 8, "smart_12": 0.7, "smart_194": 0.08
        }
    ),
    "health_history": _drive_b_health,
    "compression_stats": {
        "total_files": 89200,
        "compressed_files": 28400,
        "total_size_gb": 1456.8,
        "compressed_size_gb": 1289.3,
        "space_saved_gb": 167.5,
        "by_file_type": [
            {"type": "Documents", "original_gb": 210.5, "compressed_gb": 145.8, "saved_gb": 64.7},
            {"type": "Code/Text", "original_gb": 89.3, "compressed_gb": 52.1, "saved_gb": 37.2},
            {"type": "Images", "original_gb": 520.0, "compressed_gb": 478.5, "saved_gb": 41.5},
            {"type": "Videos", "original_gb": 380.0, "compressed_gb": 380.0, "saved_gb": 0.0},
            {"type": "Databases", "original_gb": 145.0, "compressed_gb": 121.0, "saved_gb": 24.0},
            {"type": "Other", "original_gb": 112.0, "compressed_gb": 111.9, "saved_gb": 0.1}
        ],
        "write_ops_history": [
            {"date": (BASE_DATE - timedelta(days=29-i)).isoformat()[:10],
             "writes_before": random.randint(15000, 22000),
             "writes_after": random.randint(10000, 16000) if i > 14 else random.randint(14000, 21000)}
            for i in range(30)
        ],
        "recommendations": [
            {"action": "Compress database dumps in /backups", "potential_savings_gb": 42.5, "file_count": 85},
            {"action": "Batch small writes in temp directories", "potential_savings_gb": 18.3, "file_count": 12400},
            {"action": "Defer non-critical log rotation", "potential_savings_gb": 8.7, "file_count": 560},
            {"action": "Optimize document archives", "potential_savings_gb": 22.1, "file_count": 340}
        ]
    },
    "life_extension": {
        "interventions": [
            {
                "date": (BASE_DATE - timedelta(days=14)).isoformat()[:10],
                "type": "compression_activated",
                "description": "Conservative compression mode activated",
                "health_at_trigger": 72,
                "write_reduction_achieved": 0.22,
                "days_gained": 2
            },
            {
                "date": (BASE_DATE - timedelta(days=7)).isoformat()[:10],
                "type": "optimization_upgraded",
                "description": "Upgraded to aggressive write batching",
                "health_at_trigger": 69,
                "write_reduction_achieved": 0.28,
                "days_gained": 2
            }
        ],
        "total_days_extended": 4,
        "baseline_remaining_days": 71,
        "current_remaining_days": 75
    }
}

# ─── Drive C: Critical ────────────────────────────────────────────────────────

_drive_c_health = []
_score_c = 58.0
for i in range(30):
    _score_c -= random.uniform(0.5, 1.2)
    _drive_c_health.append({
        "date": (BASE_DATE - timedelta(days=29-i)).isoformat()[:10],
        "score": round(max(30, _score_c), 1)
    })

DRIVE_C = {
    "drive_id": "DRIVE_C_CRITICAL",
    "name": "Toshiba P300 3TB",
    "model": "HDWD130",
    "serial_number": "Y8O3T2HFAS",
    "capacity_gb": 3000,
    "health_score": 34,
    "risk_level": "Critical",
    "days_to_failure": 18,
    "confidence_interval": {"lower": 13, "upper": 23},
    "failure_probability": 0.89,
    "optimization_active": True,
    "write_reduction": 0.52,
    "life_extended_days": 6,
    "smart_history": _generate_smart_history(
        base_values={
            "smart_5": 45, "smart_187": 8, "smart_188": 3,
            "smart_197": 5, "smart_198": 2, "smart_194": 44,
            "smart_9": 44200, "smart_12": 1150
        },
        degradation_rates={
            "smart_5": 1.5, "smart_187": 0.25, "smart_188": 0.18,
            "smart_197": 0.3, "smart_198": 0.15,
            "smart_9": 8, "smart_12": 1.7, "smart_194": 0.15
        }
    ),
    "health_history": _drive_c_health,
    "compression_stats": {
        "total_files": 215800,
        "compressed_files": 98500,
        "total_size_gb": 2234.6,
        "compressed_size_gb": 1678.2,
        "space_saved_gb": 556.4,
        "by_file_type": [
            {"type": "Documents", "original_gb": 340.0, "compressed_gb": 198.5, "saved_gb": 141.5},
            {"type": "Code/Text", "original_gb": 156.3, "compressed_gb": 78.2, "saved_gb": 78.1},
            {"type": "Images", "original_gb": 678.5, "compressed_gb": 589.0, "saved_gb": 89.5},
            {"type": "Videos", "original_gb": 720.0, "compressed_gb": 720.0, "saved_gb": 0.0},
            {"type": "Databases", "original_gb": 198.8, "compressed_gb": 52.5, "saved_gb": 146.3},
            {"type": "Other", "original_gb": 141.0, "compressed_gb": 40.0, "saved_gb": 101.0}
        ],
        "write_ops_history": [
            {"date": (BASE_DATE - timedelta(days=29-i)).isoformat()[:10],
             "writes_before": random.randint(25000, 38000),
             "writes_after": random.randint(10000, 18000) if i > 10 else random.randint(22000, 35000)}
            for i in range(30)
        ],
        "recommendations": [
            {"action": "⚠️ URGENT: Backup all critical data immediately", "potential_savings_gb": 0, "file_count": 0},
            {"action": "Enable read-only mode for cold data partitions", "potential_savings_gb": 85.2, "file_count": 45000},
            {"action": "Consolidate all log files (aggressive)", "potential_savings_gb": 32.8, "file_count": 8900},
            {"action": "Migrate hot data to healthy drive", "potential_savings_gb": 120.0, "file_count": 15600}
        ]
    },
    "life_extension": {
        "interventions": [
            {
                "date": (BASE_DATE - timedelta(days=25)).isoformat()[:10],
                "type": "early_warning",
                "description": "Health decline detected — monitoring increased to hourly",
                "health_at_trigger": 52,
                "write_reduction_achieved": 0.0,
                "days_gained": 0
            },
            {
                "date": (BASE_DATE - timedelta(days=22)).isoformat()[:10],
                "type": "compression_activated",
                "description": "Aggressive compression mode activated",
                "health_at_trigger": 48,
                "write_reduction_achieved": 0.35,
                "days_gained": 2
            },
            {
                "date": (BASE_DATE - timedelta(days=15)).isoformat()[:10],
                "type": "emergency_mode",
                "description": "Emergency mode — minimal writes, backup prompted",
                "health_at_trigger": 40,
                "write_reduction_achieved": 0.52,
                "days_gained": 3
            },
            {
                "date": (BASE_DATE - timedelta(days=8)).isoformat()[:10],
                "type": "optimization_maxed",
                "description": "Maximum write reduction achieved (52%)",
                "health_at_trigger": 36,
                "write_reduction_achieved": 0.52,
                "days_gained": 1
            }
        ],
        "total_days_extended": 6,
        "baseline_remaining_days": 12,
        "current_remaining_days": 18
    }
}

# ─── All Drives Registry ──────────────────────────────────────────────────────

ALL_DRIVES = {
    "DRIVE_A_HEALTHY": DRIVE_A,
    "DRIVE_B_WARNING": DRIVE_B,
    "DRIVE_C_CRITICAL": DRIVE_C,
}


def get_drive(drive_id: str):
    """Get drive data by ID. Returns None if not found."""
    return ALL_DRIVES.get(drive_id)


def get_all_drives_summary():
    """Get summary of all drives for the drive selector."""
    return [
        {
            "drive_id": d["drive_id"],
            "name": d["name"],
            "model": d["model"],
            "capacity_gb": d["capacity_gb"],
            "health_score": d["health_score"],
            "risk_level": d["risk_level"],
            "days_to_failure": d["days_to_failure"],
        }
        for d in ALL_DRIVES.values()
    ]

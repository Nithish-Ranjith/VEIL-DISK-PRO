<#
.SYNOPSIS
    Sentinel Disk Pro - Windows Setup Script
    Mounts physical drives into WSL2 and launches the application.

.DESCRIPTION
    This script:
    1. Checks all prerequisites (Docker, WSL2, Admin rights)
    2. Detects all physical drives on the system
    3. Mounts each drive into WSL2 so Docker can access them
    4. Starts the application with Docker Compose

.NOTES
    MUST be run as Administrator.
    Requires Windows 11 or Windows 10 Build 21364+ for `wsl --mount`.
    Requires Docker Desktop with WSL2 backend enabled.

.EXAMPLE
    # Right-click PowerShell → Run as Administrator, then:
    .\windows_setup\setup-windows.ps1
#>

#Requires -RunAsAdministrator
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Colors ────────────────────────────────────────────────────────────────────
function Write-Step  { Write-Host "  ▶ $args" -ForegroundColor Cyan }
function Write-OK    { Write-Host "  ✓ $args" -ForegroundColor Green }
function Write-Warn  { Write-Host "  ⚠ $args" -ForegroundColor Yellow }
function Write-Fail  { Write-Host "  ✗ $args" -ForegroundColor Red }
function Write-Banner{ Write-Host "`n════════════════════════════════════════════" -ForegroundColor Magenta }

Write-Banner
Write-Host "  🛡  SENTINEL DISK PRO — Windows Setup" -ForegroundColor Magenta
Write-Banner

# ── Step 1: Check Prerequisites ──────────────────────────────────────────────
Write-Host "`n[1/5] Checking prerequisites..." -ForegroundColor White

# Check WSL2
Write-Step "Checking WSL2..."
try {
    $wslVersion = wsl --version 2>&1 | Select-Object -First 1
    Write-OK "WSL2 found: $wslVersion"
} catch {
    Write-Fail "WSL2 not found. Install it: wsl --install"
    exit 1
}

# Check Docker
Write-Step "Checking Docker Desktop..."
try {
    $dockerVersion = docker --version 2>&1
    Write-OK "Docker found: $dockerVersion"
} catch {
    Write-Fail "Docker not found. Install Docker Desktop from https://docker.com/get-started"
    exit 1
}

# Check Docker engine is running
Write-Step "Checking Docker engine is running..."
try {
    docker info 2>&1 | Out-Null
    Write-OK "Docker engine is running"
} catch {
    Write-Fail "Docker engine is not running. Please start Docker Desktop."
    exit 1
}

# ── Step 2: Detect Physical Drives ──────────────────────────────────────────
Write-Host "`n[2/5] Detecting physical drives..." -ForegroundColor White

$physicalDrives = Get-PhysicalDisk | Select-Object FriendlyName, MediaType, Size

if ($physicalDrives.Count -eq 0) {
    Write-Fail "No physical drives detected."
    exit 1
}

Write-OK "Found $($physicalDrives.Count) physical drive(s):"
foreach ($disk in $physicalDrives) {
    $sizeGB = [math]::Round($disk.Size / 1GB, 1)
    Write-Host "     • $($disk.FriendlyName) ($($disk.MediaType), ${sizeGB} GB)" -ForegroundColor Gray
}

# ── Step 3: Mount Drives into WSL2 ──────────────────────────────────────────
Write-Host "`n[3/5] Mounting drives into WSL2..." -ForegroundColor White
Write-Warn "Note: WSL2 mount requires Windows 11 or Windows 10 Build 21364+"

$driveList = Get-Disk | Where-Object { $_.OperationalStatus -eq "Online" }
$mountedCount = 0

foreach ($disk in $driveList) {
    $driveIndex = $disk.Number
    $drivePath  = "\\.\PhysicalDrive$driveIndex"

    Write-Step "Attempting to mount $drivePath into WSL2..."

    # Check if already mounted
    $existingMount = wsl --list --verbose 2>&1 | Select-String "PhysicalDrive$driveIndex"
    if ($existingMount) {
        Write-OK "$drivePath already mounted in WSL2"
        $mountedCount++
        continue
    }

    try {
        # Mount the physical disk into WSL2
        # --bare = mount as raw block device without filesystem auto-mount
        $mountResult = wsl --mount $drivePath --bare 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-OK "Mounted $drivePath → /dev/sd$([char](97 + $driveIndex))"
            $mountedCount++
        } else {
            Write-Warn "Could not mount $drivePath (may be system drive or locked): $mountResult"
        }
    } catch {
        Write-Warn "Mount failed for $drivePath`: $_"
    }
}

if ($mountedCount -eq 0) {
    Write-Warn "No drives mounted into WSL2. Docker will use simulated data or Layer 1-4 native Windows fallbacks."
    Write-Warn "This is fine — the app still works via WMI/ctypes layers."
} else {
    Write-OK "$mountedCount drive(s) mounted into WSL2"
}

# ── Step 4: Verify Smartctl in WSL2 (optional) ──────────────────────────────
Write-Host "`n[4/5] Checking smartctl availability in WSL2..." -ForegroundColor White

try {
    $smartctlCheck = wsl smartctl --version 2>&1 | Select-Object -First 1
    Write-OK "smartctl available in WSL2: $smartctlCheck"
} catch {
    Write-Warn "smartctl not found in WSL2. Docker will install it automatically in the container."
    Write-Warn "Or install manually: wsl sudo apt install smartmontools"
}

# ── Step 5: Start Application ────────────────────────────────────────────────
Write-Host "`n[5/5] Starting Sentinel Disk Pro..." -ForegroundColor White

$composeFile      = Join-Path $PSScriptRoot "..\docker-compose.yml"
$composeWinFile   = Join-Path $PSScriptRoot "..\docker-compose.windows.yml"

if (-not (Test-Path $composeFile)) {
    Write-Fail "docker-compose.yml not found at: $composeFile"
    Write-Fail "Run this script from the windows_setup directory."
    exit 1
}

Write-Step "Building and starting containers (this takes ~2 minutes on first run)..."

try {
    docker compose `
        -f $composeFile `
        -f $composeWinFile `
        up --build -d

    if ($LASTEXITCODE -eq 0) {
        Write-Banner
        Write-Host "`n  ✅  Sentinel Disk Pro is now running!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  🌐  Open your browser at: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "  🔧  API backend running at: http://localhost:8000" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  📊  Data Source: " -NoNewline -ForegroundColor White
        if ($mountedCount -gt 0) {
            Write-Host "Real Disk Data (WSL2 passthrough)" -ForegroundColor Green
        } else {
            Write-Host "Windows Native APIs (WMI / ctypes)" -ForegroundColor Yellow
        }
        Write-Host ""
        Write-Host "  To stop: docker compose down" -ForegroundColor Gray
        Write-Banner
    } else {
        Write-Fail "Docker Compose failed. Check error output above."
        exit 1
    }
} catch {
    Write-Fail "Failed to start containers: $_"
    exit 1
}

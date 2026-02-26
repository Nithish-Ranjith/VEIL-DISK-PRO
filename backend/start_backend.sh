#!/bin/bash
# SENTINEL-DISK Pro — Backend Launcher
# Handles privilege elevation on macOS for real SMART data access.

set -euo pipefail

# Resolve the true absolute path of this script (handles symlinks + osascript re-invoke)
SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}SENTINEL-DISK Pro Backend Launcher${NC}"
echo "========================================"

# ── macOS privilege elevation ──────────────────────────────────────────────────
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ "$EUID" -ne 0 ]; then
        echo -e "${YELLOW}⚠️  SMART data requires root. Requesting via macOS auth dialog...${NC}"
        # Use SELF (absolute path) and export PATH so smartctl is found after elevation
        osascript -e "do shell script \"PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin bash '$SELF'\" with administrator privileges" && exit 0
        # If osascript fails (e.g. cancelled), fall through to normal start
        echo -e "${YELLOW}  Auth cancelled or failed — starting without root (simulated mode).${NC}"
    fi
fi

# Ensure smartctl is in PATH (Homebrew on Apple Silicon)
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if command -v smartctl &>/dev/null; then
    echo -e "${GREEN}✅ smartctl found: $(smartctl --version | head -n1)${NC}"
else
    echo -e "${RED}⚠️  smartctl not found — real SMART data unavailable.${NC}"
    echo "   Install with: brew install smartmontools"
fi

# Navigate to the backend directory
cd "$(dirname "$SELF")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

echo -e "${GREEN}Starting Uvicorn Server on port 8090...${NC}"
exec uvicorn main:app --host 0.0.0.0 --port 8090 --reload

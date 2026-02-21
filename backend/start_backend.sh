#!/bin/bash

# Define colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}SENTINEL-DISK Pro Backend Launcher${NC}"
echo "========================================"

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}Checking permissions for SMART access...${NC}"
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        echo -e "${YELLOW}Access to physical drive health (SMART) requires root privileges.${NC}"
        echo "Requesting functionality via standard macOS authentication dialog..."
        
        # Self-elevate using osascript
        # We invoke the same script again with sudo, preserving arguments
        osascript -e "do shell script \"'$0' $*\" with administrator privileges"
        exit $?
    fi
fi

echo -e "${GREEN}✅ Running with elevated privileges.${NC}"

# Navigate to script directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Check for smartctl
if ! command -v smartctl &> /dev/null; then
    echo -e "${RED}⚠️  smartctl not found!${NC}"
    echo "Real SMART data will be unavailable. Only basic drive info will be shown."
    echo "Install with: brew install smartmontools"
    # We proceed anyway, relying on the new fallback-free smart_reader.py
else
    echo -e "${GREEN}✅ smartctl detected.$(smartctl --version | head -n 1)${NC}"
fi

echo "Starting Uvicorn Server..."
# Run the application
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

#!/bin/bash
# ============================================================
#  SENTINEL-DISK Pro -- One-Command Launcher (macOS / Linux)
#  Usage:   ./start.sh
#  To stop: ./start.sh stop
# ============================================================
set -euo pipefail

PROJ_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJ_DIR/backend"
FRONTEND_DIR="$PROJ_DIR/frontend"
BACKEND_PORT=8090
FRONTEND_PORT=5190
BACKEND_LOG="/tmp/sentinel_backend.log"
FRONTEND_LOG="/tmp/sentinel_frontend.log"
PID_FILE="/tmp/sentinel_pids.txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

banner() {
  echo ""
  echo -e "${BOLD}${BLUE}============================================${NC}"
  echo -e "${BOLD}${BLUE}   Shield  SENTINEL-DISK Pro  -- Starting   ${NC}"
  echo -e "${BOLD}${BLUE}============================================${NC}"
  echo ""
}

# ── Stop all processes -----------------------------------------------
if [[ "${1:-}" == "stop" ]]; then
  echo -e "${YELLOW}Stopping SENTINEL-DISK Pro...${NC}"
  if [[ -f "$PID_FILE" ]]; then
    while IFS= read -r pid; do
      kill "$pid" 2>/dev/null && echo "  Killed PID $pid" || true
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi
  lsof -ti :"$BACKEND_PORT"  2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti :"$FRONTEND_PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
  echo -e "${GREEN}Stopped.${NC}"
  exit 0
fi

banner

# ── Clear stale processes on our ports ------------------------------
echo -e "${CYAN}[1/4] Clearing ports $BACKEND_PORT and $FRONTEND_PORT...${NC}"
lsof -ti :"$BACKEND_PORT"  2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti :"$FRONTEND_PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# ── Check prerequisites ---------------------------------------------
echo -e "${CYAN}[2/4] Checking prerequisites...${NC}"
if ! command -v python3 >/dev/null 2>&1; then
  echo -e "${RED}python3 not found. Please install Python 3.${NC}"; exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}node not found. Install from https://nodejs.org${NC}"; exit 1
fi

# Install frontend deps on first run
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo -e "${YELLOW}   Installing frontend dependencies (first run)...${NC}"
  cd "$FRONTEND_DIR" && npm install --silent
fi

# ── Start backend ---------------------------------------------------
echo -e "${CYAN}[3/4] Starting backend on port $BACKEND_PORT...${NC}"
cd "$BACKEND_DIR"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if [[ -d "venv" ]]; then
  source venv/bin/activate
else
  echo -e "${YELLOW}   No venv found -- using system python3${NC}"
fi

rm -f "$PID_FILE"

# ── Auto-heal: remove any root-owned health cache files (from past sudo run) ---
DATA_DIR="$BACKEND_DIR/data"
if [[ -d "$DATA_DIR" ]]; then
  while IFS= read -r -d '' f; do
    if [[ ! -w "$f" ]]; then
      rm -f "$f" 2>/dev/null && echo -e "   ${YELLOW}Removed root-owned cache: $(basename "$f")${NC}" || true
    fi
  done < <(find "$DATA_DIR" -name "health_cache_*.json" -print0 2>/dev/null)
fi

nohup uvicorn main:app --host 0.0.0.0 --port "$BACKEND_PORT" > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PID_FILE"

# Wait for backend to be healthy (up to 20s)
echo -n "   Waiting for backend"
BACKEND_READY=false
for i in $(seq 1 20); do
  if curl -s "http://localhost:$BACKEND_PORT/api/v1/drives" >/dev/null 2>&1; then
    echo -e " ${GREEN}Ready!${NC}"
    BACKEND_READY=true
    break
  fi
  echo -n "."
  sleep 1
done

if [[ "$BACKEND_READY" == "false" ]]; then
  echo -e "${YELLOW}"
  echo "   Backend taking longer than expected. Last log:"
  tail -5 "$BACKEND_LOG" 2>/dev/null || echo "   (no log yet)"
  echo -e "${NC}"
fi

# ── Start frontend --------------------------------------------------
echo -e "${CYAN}[4/4] Starting frontend on port $FRONTEND_PORT...${NC}"
cd "$FRONTEND_DIR"
nohup npm run dev -- --port "$FRONTEND_PORT" --host > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" >> "$PID_FILE"

# Wait for frontend (up to 20s)
echo -n "   Waiting for frontend"
FRONTEND_READY=false
for i in $(seq 1 20); do
  if curl -s "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
    echo -e " ${GREEN}Ready!${NC}"
    FRONTEND_READY=true
    break
  fi
  echo -n "."
  sleep 1
done

if [[ "$FRONTEND_READY" == "false" ]]; then
  echo -e "${YELLOW}"
  echo "   Frontend taking longer than expected. Last log:"
  tail -5 "$FRONTEND_LOG" 2>/dev/null || echo "   (no log yet)"
  echo -e "${NC}"
fi

# ── Summary ---------------------------------------------------------
echo ""
echo -e "${BOLD}${GREEN}============================================${NC}"
echo -e "${BOLD}${GREEN}  SENTINEL-DISK Pro is running!${NC}"
echo -e "${GREEN}  Frontend  -->  http://localhost:$FRONTEND_PORT${NC}"
echo -e "${GREEN}  Backend   -->  http://localhost:$BACKEND_PORT${NC}"
echo -e "${GREEN}  API Docs  -->  http://localhost:$BACKEND_PORT/docs${NC}"
echo -e "${BOLD}${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}  To stop:  ./start.sh stop${NC}"
echo -e "${YELLOW}  Backend log:  tail -f $BACKEND_LOG${NC}"
echo -e "${YELLOW}  Frontend log: tail -f $FRONTEND_LOG${NC}"
echo ""

# Open browser
sleep 1
if command -v open >/dev/null 2>&1; then
  open "http://localhost:$FRONTEND_PORT" 2>/dev/null || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:$FRONTEND_PORT" 2>/dev/null || true
fi

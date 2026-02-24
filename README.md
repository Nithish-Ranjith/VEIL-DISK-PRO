# SENTINEL-DISK Pro

**AI-powered drive health monitoring, warranty claim report generation, and life extension.**

Supports macOS · Linux · Windows — reads **real SMART data** from physical drives.

---

## ⚡ Quick Start (Native — No Docker)

### Prerequisites
| Tool | macOS | Linux | Windows |
|------|-------|-------|---------|
| Python 3.10+ | `brew install python` | `apt install python3` | [python.org](https://python.org) |
| Node.js 20+ | `brew install node` | `apt install nodejs` | [nodejs.org](https://nodejs.org) |
| smartmontools | `brew install smartmontools` | `apt install smartmontools` | [smartmontools.org](https://www.smartmontools.org/wiki/Download) |

### 1. Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate          # macOS / Linux
# OR: venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Start (macOS/Linux)
PATH="/opt/homebrew/bin:$PATH" uvicorn main:app --host 0.0.0.0 --port 8080

# Start (Windows — run as Administrator for SMART access)
uvicorn main:app --host 0.0.0.0 --port 8080
```

> **macOS + real SMART data:** Run `sudo ./start_backend.sh` to auto-elevate via macOS auth dialog.

### 2. Frontend

```bash
cd frontend

npm install

# Set backend URL (required — backend runs on 8080)
echo "VITE_API_URL=http://localhost:8080/api/v1" > .env

npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🐳 Docker Deployment

> Docker Desktop must be installed. On Linux, standard Docker Engine works.

### One-command start

```bash
docker compose up --build
```

Frontend → **http://localhost:3000**
Backend API → **http://localhost:8000**

### Deploy to a remote server

```bash
# Set your server's public IP or domain
export VITE_API_URL=http://YOUR_SERVER_IP:8000/api/v1
export ALLOWED_ORIGINS=http://YOUR_SERVER_IP:3000

docker compose up --build -d
```

> `--privileged: true` is already set in `docker-compose.yml` so smartctl can access real disk devices inside the container.

---

## 🖥️ Platform Notes

### macOS (Apple Silicon / Intel)
- 4 internal SSDs detected automatically via `diskutil`
- Full SMART attributes need **root** — run `sudo ./start_backend.sh`
- Without root: drive health shows as **"Apple Storage Verified"** (safe/healthy status from OS)

### Linux
- Full SMART data with no restrictions — just install `smartmontools`
- Inside Docker: works automatically with `privileged: true`

### Windows
- Run terminal as **Administrator** for SMART access
- 4-layer fallback: `smartctl.exe` → WMI → ctypes DeviceIoControl → `wmic`
- See `windows_setup/setup-windows.ps1` for automated setup

---

## 📋 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (Docker liveness) |
| `GET` | `/api/v1/drives` | List all physical drives |
| `GET` | `/api/v1/drive/{id}/status` | Full coordinator cycle result |
| `GET` | `/api/v1/drive/{id}/urgency` | Backup urgency score |
| `GET` | `/api/v1/report/{id}` | **Download Warranty Claim PDF** |
| `POST` | `/api/v1/drive/{id}/backup` | Trigger OS backup (Time Machine / rsync / wbadmin) |
| `POST` | `/api/v1/whatif` | What-If health prediction |
| `GET` | `/api/v1/settings` | Get settings |
| `POST` | `/api/v1/settings` | Update settings |
| `GET` | `/docs` | Interactive API docs (Swagger UI) |

---

## 🗂️ Project Structure

```
sentinel-disk-pro/
├── backend/
│   ├── main.py              # FastAPI app + all endpoints
│   ├── smart_reader.py      # SMART data (macOS/Linux/Windows)
│   ├── health_engine.py     # TCN ML + rule-based prediction
│   ├── compression_engine.py # Write reduction analysis
│   ├── coordinator.py       # Closed-loop life extension
│   ├── utils/pdf_generator.py # Warranty claim PDF
│   ├── requirements.txt
│   ├── start_backend.sh     # macOS launcher with privilege elevation
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/health/HealthMonitor.jsx  # Warranty Report button here
│   │   └── api/client.js    # Axios client (VITE_API_URL)
│   ├── nginx.conf           # SPA routing + /api proxy
│   └── Dockerfile
├── docker-compose.yml       # Production-ready compose
└── windows_setup/
    └── setup-windows.ps1    # Windows automated setup
```

---

## 🔐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Backend URL baked into frontend at build time |
| `ALLOWED_ORIGINS` | `*` | CORS origins (comma-separated, or `*` for open) |
| `PORT` | `8000` | Backend port (Docker) |

---

## 🧹 First-run cache cleanup (if previously run as sudo)

If you see `Permission denied writing to data/health_cache_*.json` warnings:

```bash
sudo rm backend/data/health_cache_*.json
```

The backend will recreate them with correct ownership on next start.

# Quick Start: AI Proctor Service

## Problem
The AI Proctor service closes immediately when launched from `start.bat`, even though it works when started manually.

## Solution

### Step 1: Test with the Standalone Launcher
Instead of using `start.bat`, test the AI Proctor service in isolation with the dedicated batch file:

```batch
start-ai-proctor.bat
```

This will:
- Show you any Python errors or missing dependencies
- Check if port 8090 is available
- Install/update dependencies automatically
- Keep the window open so you can see the output

**Expected Success Output:**
```
Current directory: C:\Users\ITSupport\Downloads\Exam Potal\services\ai-proctor
✓ Python is available.
✓ Port 8090 is available.
✓ Dependencies installed successfully.

Starting AI Proctor service...

INFO:     Uvicorn running on http://0.0.0.0:8090 (Press CTRL+C to quit)
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

If the window closes or shows errors, see the Troubleshooting Guide below.

---

### Step 2: Verify Service is Running
Once the service starts, open another Command Prompt window and test the health endpoint:

```batch
curl http://localhost:8090/health
```

**Expected output:**
```json
{"status":"ok","mediapipe":"available"}
```

---

### Step 3: Alternative - Use PowerShell Script
If the batch file has issues, try the PowerShell version (better for process management):

```powershell
powershell -ExecutionPolicy Bypass -File start-ai-proctor.ps1
```

---

### Step 4: Use the Updated start.bat
Once the standalone launcher works, use the updated `start.bat`:

```batch
start.bat
```

The updated version includes:
- Port availability check before starting
- Better error messages
- Improved logging

---

## Troubleshooting

If `start-ai-proctor.bat` shows errors, refer to **AI_PROCTOR_TROUBLESHOOTING.md** for:
- Python installation verification
- Dependency checks
- Port conflicts
- MediaPipe issues
- Common error solutions

---

## File Locations

```
Exam Portal/
├── start.bat                          ← Main server launcher (all services)
├── start-ai-proctor.bat               ← AI Proctor standalone (NEW - test this first)
├── start-ai-proctor.ps1               ← PowerShell alternative (NEW)
├── QUICK_START_AI_PROCTOR.md          ← This file
├── AI_PROCTOR_TROUBLESHOOTING.md      ← Detailed troubleshooting guide
├── .env                               ← Configuration (ENABLE_AI_PROCTORING=true)
└── services/
    └── ai-proctor/
        ├── app.py                     ← FastAPI service
        ├── requirements.txt           ← Python dependencies
        └── ...
```

---

## Quick Diagnostics

**Check Python:**
```batch
python --version
```

**Check port 8090:**
```batch
netstat -ano | findstr ":8090"
```
(Should show nothing if available)

**Check dependencies:**
```batch
cd services\ai-proctor
pip list | findstr mediapipe fastapi uvicorn
```

**Test dependencies:**
```batch
cd services\ai-proctor
python -c "import mediapipe; print('MediaPipe OK'); import fastapi; print('FastAPI OK')"
```

---

## Next Steps

1. **Run `start-ai-proctor.bat`** and let it start the service
2. **Wait for the "Application startup complete" message**
3. **Test `/health` endpoint** with curl command above
4. **Once working, use `start.bat`** for all services
5. **Access the admin dashboard** at http://localhost:4173

---

## Still Having Issues?

Refer to **AI_PROCTOR_TROUBLESHOOTING.md** for detailed solutions to:
- ModuleNotFoundError
- Address already in use
- Window closes immediately
- Service not responding
- And more...

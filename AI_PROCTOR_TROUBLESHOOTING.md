# AI Proctor Service - Troubleshooting Guide

## Overview
The AI Proctor service is a FastAPI-based microservice that runs on **port 8090** and provides real-time face detection and anti-cheat monitoring for exam candidates.

---

## Quick Start

### Option 1: Using Standalone Batch File (Recommended for Testing)
This provides the best visibility into startup errors:

```bash
start-ai-proctor.bat
```

This will:
- Check if Python is installed and in PATH
- Verify port 8090 is available
- Install/update dependencies
- Start the service with verbose logging
- Keep the window open if there are errors

### Option 2: Using PowerShell Script
Better for process management on modern Windows:

```powershell
powershell -ExecutionPolicy Bypass -File start-ai-proctor.ps1
```

### Option 3: Using Main Server Launcher
Start all services together:

```bash
start.bat
```

---

## Diagnostics

### 1. Verify Python Installation

Open Command Prompt and run:
```batch
python --version
```

**Expected output:** `Python 3.8+` (any recent version is fine)

**If command not found:** Python is not in PATH. 
- Solution: Reinstall Python and check "Add Python to PATH" during installation

---

### 2. Check Port 8090 Availability

Open Command Prompt and run:
```batch
netstat -ano | findstr ":8090"
```

**If nothing is returned:** Port is available ✓

**If you see output:** Port is in use
```
  TCP    127.0.0.1:8090         0.0.0.0:0              LISTENING       5432
```

**Solution:** 
- Find the PID (last number, e.g., 5432)
- Kill it: `taskkill /PID 5432 /F`
- Or use a different port in .env: `PROCTOR_SERVICE_URL=http://localhost:8091`

---

### 3. Verify Dependencies

Open Command Prompt in the `services\ai-proctor` directory:

```batch
cd services\ai-proctor
pip list
```

**Required packages:**
- fastapi
- uvicorn
- httpx
- mediapipe (≥ 0.10.30)
- Pillow
- numpy

**Missing dependencies:**
```batch
pip install -r requirements.txt
```

---

### 4. Test Mediapipe Installation

Create a test file `test_mediapipe.py`:

```python
try:
    import mediapipe as mp
    print("✓ MediaPipe imported successfully")
    print(f"  Version: {mp.__version__}")
    
    face_detection = mp.solutions.face_detection
    face_mesh = mp.solutions.face_mesh
    print("✓ Face detection module available")
    print("✓ Face mesh module available")
except Exception as e:
    print(f"✗ Error: {e}")
```

Run it:
```batch
python test_mediapipe.py
```

**If successful:** All MediaPipe modules are working ✓

**If failed:** Reinstall MediaPipe
```batch
pip uninstall mediapipe -y
pip install mediapipe>=0.10.30
```

---

### 5. Test Service Startup Directly

Run the standalone batch file:

```batch
start-ai-proctor.bat
```

**Expected output:**
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

**If the window closes immediately:**
- Check the output above the "Starting AI Proctor service..." line
- It will show Python errors or missing dependencies

---

### 6. Test Service Health Endpoint

Once the service is running, open another Command Prompt:

```batch
curl http://localhost:8090/health
```

**Expected output:**
```json
{"status":"ok","mediapipe":"available"}
```

**If connection refused:** Service is not running
- Check the AI Proctor window for startup errors
- Verify port 8090 is available (see Diagnostic #2)

**If mediapipe shows "unavailable":** MediaPipe import failed
- Check Diagnostic #4 above

---

## Common Issues

### Issue: "ModuleNotFoundError: No module named 'mediapipe'"

**Cause:** MediaPipe not installed or wrong version

**Solution:**
```batch
pip uninstall mediapipe -y
pip install mediapipe>=0.10.30
```

If this fails, you may have a missing system dependency:
- On Windows, some ML libraries require Visual C++ Redistributables
- Download and install from: https://support.microsoft.com/en-us/help/2977003

---

### Issue: "Address already in use" on port 8090

**Cause:** Another process is using port 8090

**Solution:**
```batch
# Find what's using port 8090
netstat -ano | findstr ":8090"

# Kill the process (replace PID with the actual PID)
taskkill /PID 5432 /F

# Or change the port in .env
PROCTOR_SERVICE_URL=http://localhost:8091
```

Then modify start.bat to use the new port:
```batch
python -m uvicorn app:app --host 0.0.0.0 --port 8091
```

---

### Issue: Window closes immediately in start.bat

**Cause:** Python error on startup, not visible before window closes

**Solution:**
1. Use `start-ai-proctor.bat` instead (better error visibility)
2. Or redirect output to a log file:

```batch
cd services\ai-proctor
python -m uvicorn app:app --host 0.0.0.0 --port 8090 > ai-proctor.log 2>&1
```

Then check `ai-proctor.log` for errors.

---

### Issue: AI Proctor works manually but not in start.bat

**Cause:** Environment or working directory issue when launched via `start` command

**Solution:**
1. Try the PowerShell script: `start-ai-proctor.ps1`
2. Create a dedicated batch file wrapper:

```batch
@echo off
cd /d "%~dp0services\ai-proctor"
python -m uvicorn app:app --host 0.0.0.0 --port 8090
pause
```

Then modify start.bat to run this file:
```batch
start "Exam Portal - AI Proctor" call "%~dp0start-ai-proctor.bat"
```

---

## Configuration

### Ports
- **AI Proctor:** 8090 (configured in .env as `PROCTOR_SERVICE_URL=http://localhost:8090`)
- **Backend API:** 8080
- **Frontend:** 4173

### Environment Variables
In `.env` (root directory):
```
ENABLE_AI_PROCTORING=true          # Enable/disable the service
PROCTOR_SERVICE_URL=http://localhost:8090
PROCTOR_API_TOKEN=change-me-proctor  # Token for API communication
```

### Service Files
- **Main script:** `services/ai-proctor/app.py`
- **Dependencies:** `services/ai-proctor/requirements.txt`
- **Launchers:**
  - `start.bat` - Launch all services
  - `start-ai-proctor.bat` - Launch AI Proctor only
  - `start-ai-proctor.ps1` - PowerShell version

---

## Verification Checklist

After starting the AI Proctor service, verify:

- [ ] Service window opened (CMD window titled "Exam Portal - AI Proctor")
- [ ] No error messages in the window
- [ ] Service is listening on port 8090
- [ ] Health check returns `{"status":"ok","mediapipe":"available"}`
- [ ] Main start.bat shows all 4 services running
- [ ] Admin dashboard shows no errors in browser console
- [ ] Can view live monitoring and violations

---

## Logs and Debugging

### View Service Logs
The AI Proctor window shows live logs. Key messages:

```
INFO:     Uvicorn running on http://0.0.0.0:8090
INFO:     Application startup complete
```

### Enable Debug Logging
Modify the start command to use `--log-level debug`:

```batch
python -m uvicorn app:app --host 0.0.0.0 --port 8090 --log-level debug
```

### Save Logs to File
For persistent logs:

```batch
python -m uvicorn app:app --host 0.0.0.0 --port 8090 > ai-proctor.log 2>&1
```

Check `ai-proctor.log` for startup issues.

---

## Getting Help

If the service still doesn't start:

1. Run `start-ai-proctor.bat` and screenshot all output
2. Run `python test_mediapipe.py` and share the result
3. Run `netstat -ano | findstr ":8090"` to check if anything is using the port
4. Check if Python is in PATH: `python --version`
5. Check if dependencies are installed: `pip list | findstr mediapipe`

Share these diagnostics when reporting issues.

@echo off
setlocal enabledelayedexpansion
title Exam Portal - AI Proctor Service (Standalone)
color 0A

echo ============================================
echo     AI PROCTOR SERVICE - STANDALONE TEST
echo ============================================
echo.

cd /d "%~dp0services\ai-proctor"

if not exist "app.py" (
    echo ERROR: app.py not found in %cd%
    echo Please make sure you're in the services\ai-proctor directory.
    pause
    exit /b 1
)

echo Current directory: %cd%
echo.

echo Checking Python installation...
python --version
if %errorlevel%==0 (
    echo       ✓ Python is available.
) else (
    echo       ✗ ERROR: Python is not available in PATH!
    echo       Please install Python and add it to PATH.
    pause
    exit /b 1
)
echo.

echo Checking if port 8091 is available...
netstat -ano | findstr ":8091" >nul 2>&1
if %errorlevel%==0 (
    echo       ✗ WARNING: Port 8091 is already in use!
    echo       Kill the existing process or use a different port.
    netstat -ano | findstr ":8091"
    pause
    exit /b 1
) else (
    echo       ✓ Port 8091 is available.
)
echo.

echo Installing dependencies (if needed)...
python -m pip install -r requirements.txt
if %errorlevel%==0 (
    echo       ✓ Dependencies installed successfully.
) else (
    echo       ⚠ Warning: Some dependencies may not have installed properly.
    echo       (But if the service below runs, dependencies are fine)
)
echo.

echo Starting AI Proctor service...
echo.
python -m uvicorn app:app --host 0.0.0.0 --port 8091 --log-level info --reload

pause

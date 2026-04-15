@echo off
setlocal enabledelayedexpansion
title Exam Portal - Server Launcher
color 0A

echo ============================================
echo        EXAM PORTAL - SERVER LAUNCHER
echo ============================================
echo.

cd /d "%~dp0"

:: -----------------------------------------------
:: Read ENABLE_AI_PROCTORING from .env
:: -----------------------------------------------
set "AI_PROCTORING=false"
if exist ".env" (
    for /f "tokens=1,2 delims==" %%A in (.env) do (
        if "%%A"=="ENABLE_AI_PROCTORING" (
            set "AI_PROCTORING=%%B"
        )
    )
)

:: Trim whitespace from AI_PROCTORING value
for /f "tokens=*" %%A in ("!AI_PROCTORING!") do set "AI_PROCTORING=%%A"

echo Debug: ENABLE_AI_PROCTORING = !AI_PROCTORING!
echo.

echo [1/4] Checking PostgreSQL connection...
where pg_isready >nul 2>&1
if %errorlevel%==0 (
    pg_isready -h localhost -p 5432 >nul 2>&1
    if %errorlevel%==0 (
        echo       ✓ PostgreSQL is running.
    ) else (
        echo       ✗ WARNING: PostgreSQL may not be running on port 5432.
        echo       Make sure PostgreSQL is started before continuing.
        pause
    )
) else (
    echo       pg_isready not found - skipping check.
    echo       Make sure PostgreSQL is running on port 5432.
)
echo.

echo [2/4] Starting Backend API (port 8080)...
start "Exam Portal - API" cmd /k "cd /d "%~dp0" && npm run dev:api || pause"
echo       ✓ API server starting...
timeout /t 3 /nobreak >nul
echo.

echo [3/4] Starting Frontend (port 4173)...
start "Exam Portal - Frontend" cmd /k "cd /d "%~dp0" && npm run dev:frontend || pause"
echo       ✓ Frontend server starting...
timeout /t 3 /nobreak >nul
echo.

:: -----------------------------------------------
:: Start AI Proctor if enabled
:: -----------------------------------------------
if /i "!AI_PROCTORING!"=="true" (
    echo [4/4] AI Proctoring is ENABLED - Starting AI Proctor (port 8091)...
    if exist "%~dp0start-ai-proctor.bat" (
        echo       Launching AI Proctor service...
        start "Exam Portal - AI Proctor" cmd /k "call "%~dp0start-ai-proctor.bat""
        echo       ✓ AI Proctor service starting on port 8091...
        timeout /t 3 /nobreak >nul
    ) else (
        echo       ✗ ERROR: start-ai-proctor.bat not found!
        echo       Please make sure start-ai-proctor.bat is in the root directory.
    )
) else (
    echo [4/4] AI Proctoring is DISABLED - Skipping AI Proctor.
    echo       To enable, edit .env and set: ENABLE_AI_PROCTORING=true
)
echo.

echo ============================================
echo  All servers launched successfully!
echo.
echo  Frontend : http://localhost:4173
echo  API      : http://localhost:8080
if /i "!AI_PROCTORING!"=="true" (
    echo  AI Proctor: http://localhost:8091 (optional, for proctoring)
)
echo  Admin    : http://localhost:4173/admin
echo.
echo  Log output appears in separate windows.
echo  Close those windows to stop the servers.
echo.
echo  This launcher window will stay open.
echo  You can close this window anytime to view the other windows.
echo ============================================
REM Launcher window stays open - user can close it manually
pause

@echo off
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
for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if /i "%%A"=="ENABLE_AI_PROCTORING" set "AI_PROCTORING=%%B"
)

echo [1/4] Checking PostgreSQL connection...
where pg_isready >nul 2>&1
if %errorlevel%==0 (
    pg_isready -h localhost -p 5432 >nul 2>&1
    if %errorlevel%==0 (
        echo       PostgreSQL is running.
    ) else (
        echo       WARNING: PostgreSQL may not be running on port 5432.
        echo       Make sure PostgreSQL is started before continuing.
        pause
    )
) else (
    echo       pg_isready not found - skipping check.
    echo       Make sure PostgreSQL is running on port 5432.
)
echo.

echo [2/4] Starting Backend API (port 8080)...
start "Exam Portal - API" cmd /k "cd /d "%~dp0" && npm run dev:api"
echo       API server starting...
echo.

:: Wait a moment for API to initialize
timeout /t 3 /nobreak >nul

echo [3/4] Starting Frontend (port 4173)...
start "Exam Portal - Frontend" cmd /k "cd /d "%~dp0" && npm run dev:frontend"
echo       Frontend server starting...
echo.

:: -----------------------------------------------
:: Start AI Proctor if enabled
:: -----------------------------------------------
if /i "%AI_PROCTORING%"=="true" (
    echo [4/4] AI Proctoring is ENABLED - Starting AI Proctor (port 8090)...
    start "Exam Portal - AI Proctor" cmd /k "cd /d "%~dp0%services\ai-proctor" && python -m uvicorn app:app --host 0.0.0.0 --port 8090"
    echo       AI Proctor service starting...
) else (
    echo [4/4] AI Proctoring is DISABLED - Skipping AI Proctor.
)
echo.

echo ============================================
echo  All servers launched!
echo.
echo  Frontend : http://localhost:4173
echo  API      : http://localhost:8080
if /i "%AI_PROCTORING%"=="true" (
    echo  AI Proctor: http://localhost:8090
)
echo  Admin    : http://localhost:4173/admin
echo.
echo  Close this window or press any key to exit.
echo ============================================
pause >nul

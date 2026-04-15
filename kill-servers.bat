@echo off
echo ============================================
echo    STOPPING ALL RUNNING SERVERS
echo ============================================
echo.

echo Killing Node processes (API, Frontend)...
taskkill /F /IM node.exe >nul 2>&1
echo  ✓ Done

echo.
echo Killing Python processes (AI Proctor)...
taskkill /F /IM python.exe >nul 2>&1
echo  ✓ Done

echo.
echo Waiting 2 seconds for ports to be released...
timeout /t 2 /nobreak >nul

echo.
echo ============================================
echo All servers stopped. Ports are now free.
echo You can now run: start.bat
echo ============================================
echo.
pause

@echo off
cd /d "%~dp0"
echo Testing Frontend server...
echo.
npm run dev:frontend
echo.
echo If you see an error above, that's why the server closes.
pause

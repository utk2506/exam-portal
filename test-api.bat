@echo off
cd /d "%~dp0"
echo Testing API server...
echo.
npm run dev:api
echo.
echo If you see an error above, that's why the server closes.
pause

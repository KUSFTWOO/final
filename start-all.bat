@echo off
chcp 65001 >nul
echo ============================================
echo KBO Weather Prediction - Start All Servers
echo ============================================
echo.

set "PROJECT_ROOT=%~dp0"

echo Starting both backend and frontend servers...
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C in each window to stop the servers
echo.

:: Start Backend in new window
start "KBO Weather - Backend" cmd /k ""%~dp0start-backend.bat""

:: Wait a bit before starting frontend
timeout /t 3 /nobreak >nul

:: Start Frontend in new window
start "KBO Weather - Frontend" cmd /k ""%~dp0start-frontend.bat""

echo.
echo Both servers are starting in separate windows...
echo You can close this window - servers will continue running.
echo.
timeout /t 3 /nobreak >nul

@echo off
chcp 65001 >nul
title KBO Weather - Backend Server
echo ========================================
echo KBO Weather Prediction - Backend Server
echo ========================================
echo.

:: 프로젝트 루트에서 backend 디렉토리로 이동
cd /d "%~dp0backend"

if not exist "node_modules" (
    echo [1/2] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
) else (
    echo [1/2] Dependencies already installed
)

echo.
echo [2/2] Starting backend server...
echo.
echo Backend will run on: http://localhost:3001
echo Health check: http://localhost:3001/health
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

call npm run dev

:: 서버가 종료되면 여기로 옴
echo.
echo Backend server stopped.
pause

@echo off
chcp 65001 >nul
title KBO Weather - Frontend Server
echo =========================================
echo KBO Weather Prediction - Frontend Server
echo =========================================
echo.

:: 프로젝트 루트에서 frontend 디렉토리로 이동
cd /d "%~dp0frontend"

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
echo [2/2] Starting frontend server...
echo.
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
echo =========================================
echo.

call npm run dev

:: 서버가 종료되면 여기로 옴
echo.
echo Frontend server stopped.
pause

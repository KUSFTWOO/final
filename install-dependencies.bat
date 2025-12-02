@echo off
chcp 65001 >nul
echo ============================================
echo KBO Weather Prediction - Install Dependencies
echo ============================================
echo.

set "PROJECT_ROOT=%~dp0"

echo Installing backend dependencies...
cd /d "%PROJECT_ROOT%backend"
if errorlevel 1 (
    echo Error: Could not find backend directory
    pause
    exit /b 1
)

call npm install
if errorlevel 1 (
    echo Error: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Installing frontend dependencies...
cd /d "%PROJECT_ROOT%frontend"
if errorlevel 1 (
    echo Error: Could not find frontend directory
    pause
    exit /b 1
)

call npm install
if errorlevel 1 (
    echo Error: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo ============================================
echo All dependencies installed successfully!
echo ============================================
echo.
pause

@echo off
chcp 65001 >nul
echo ============================================
echo KBO Weather Prediction - Stop All Servers
echo ============================================
echo.

echo Stopping Node.js processes...
echo.

:: Kill processes running on port 3001 (backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Stopping backend server (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Kill processes running on port 3000 (frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Stopping frontend server (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Alternative: Kill all node processes (more aggressive)
echo.
echo Searching for Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I /N "node.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo Found Node.js processes. Kill all? (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        taskkill /F /IM node.exe >nul 2>&1
        echo All Node.js processes stopped.
    ) else (
        echo Skipped killing all Node.js processes.
    )
) else (
    echo No Node.js processes found.
)

echo.
echo ============================================
echo Done!
echo ============================================
echo.
pause

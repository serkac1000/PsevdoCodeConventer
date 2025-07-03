
@echo off
echo ========================================
echo Stopping PseudoCode Converter Server
echo ========================================
echo.

echo Checking for running processes...
echo.

REM Kill any Node.js processes related to this project
for /f "tokens=1" %%a in ('wmic process where "name='node.exe'" get processid /format:value ^| find "="') do (
    for /f "tokens=2 delims==" %%b in ("%%a") do (
        if not "%%b"=="" (
            echo Stopping Node.js process (PID: %%b)
            taskkill /F /PID %%b >nul 2>&1
        )
    )
)

REM Kill any processes specifically on port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    echo Stopping process on port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All server processes have been stopped.
echo You can now run start.bat to restart the server.
echo.
pause

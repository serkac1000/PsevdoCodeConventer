
@echo off
echo ========================================
echo Stopping PseudoCode Converter Server
echo ========================================
echo.

echo Checking for running processes...
echo.

REM Kill all Node.js processes
echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo Successfully stopped Node.js processes
) else (
    echo No Node.js processes found to stop
)

REM Kill any processes specifically on port 5000
echo Checking for processes on port 5000...
set found_port=0
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING" 2^>nul') do (
    echo Stopping process on port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
    set found_port=1
)

if %found_port% equ 0 (
    echo No processes found on port 5000
)

REM Kill any tsx processes that might be running
echo Stopping any TypeScript processes...
taskkill /F /IM tsx.exe >nul 2>&1

REM Wait for processes to fully terminate
echo Waiting for processes to fully terminate...
timeout /t 2 /nobreak >nul

echo.
echo All server processes have been stopped.
echo You can now run start.bat to restart the server.
echo.
pause

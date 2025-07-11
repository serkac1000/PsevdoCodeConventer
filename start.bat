
@echo off
setlocal EnableDelayedExpansion

echo ========================================
echo PseudoCode to MIT App Inventor Converter
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo After installation, restart your command prompt and try again.
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo NPM version:
npm --version
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Make sure you're running this from the project directory
    echo Current directory: %CD%
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    echo This may take a few minutes...
    echo.
    npm install
    if !errorlevel! neq 0 (
        echo ERROR: Failed to install dependencies
        echo Try running 'npm cache clean --force' and then retry
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
) else (
    echo Dependencies already installed.
    echo.
)

echo Checking for existing processes on port 5000...
echo.

REM Kill any existing Node.js processes
echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if !errorlevel! equ 0 (
    echo Stopped existing Node.js processes
) else (
    echo No existing Node.js processes found
)

REM Kill any existing processes on port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING" 2^>nul') do (
    echo Stopping process on port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

REM Wait a moment for processes to fully terminate
echo Waiting for processes to stop...
timeout /t 3 /nobreak >nul

echo Starting the application...
echo.
echo The app will be available at:
echo   - Local: http://localhost:5000
echo   - Network: http://0.0.0.0:5000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Set environment variable for Windows
set NODE_ENV=development

REM Start the server
npm run dev

if !errorlevel! neq 0 (
    echo.
    echo ERROR: Failed to start the development server
    echo Trying to kill any remaining processes and restart...
    echo.
    
    REM Try to kill processes again
    taskkill /F /IM node.exe >nul 2>&1
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING" 2^>nul') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    
    timeout /t 2 /nobreak >nul
    
    echo Retrying server start...
    npm run dev
    
    if !errorlevel! neq 0 (
        echo.
        echo ERROR: Server failed to start after retry
        echo Please check the error messages above
        echo.
        pause
        exit /b 1
    )
)

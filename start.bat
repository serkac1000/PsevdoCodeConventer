
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

npm run dev

if !errorlevel! neq 0 (
    echo.
    echo ERROR: Failed to start the development server
    echo Please check the error messages above
    echo.
    pause
    exit /b 1
)

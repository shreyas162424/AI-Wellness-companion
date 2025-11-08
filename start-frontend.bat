@echo off
echo ==================================
echo Health Companion - Frontend Setup
echo ==================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js v18+
    pause
    exit /b 1
)

echo ✓ Node.js found:
node --version
echo.

echo Installing Node.js dependencies...
echo.

call npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✓ Dependencies installed successfully!
echo.
echo Starting Next.js development server...
echo Frontend will run on http://localhost:3000
echo.
echo Keep this window open while using the app.
echo To stop: Press Ctrl+C
echo.

call npm run dev
pause

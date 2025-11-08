@echo off
echo ==================================
echo Health Companion - Backend Setup
echo ==================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.9+
    pause
    exit /b 1
)

echo ✓ Python found:
python --version
echo.

echo Installing Python dependencies...
echo (This may take 5-10 minutes on first run due to ML model downloads)
echo.

pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✓ Dependencies installed successfully!
echo.
echo Starting Flask backend server...
echo Server will run on http://localhost:5000
echo.
echo Keep this window open while using the app.
echo To stop: Press Ctrl+C
echo.

python app.py
pause

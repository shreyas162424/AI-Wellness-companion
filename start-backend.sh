#!/bin/bash

echo "=================================="
echo "Health Companion - Backend Setup"
echo "=================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+"
    exit 1
fi

echo "✓ Python found: $(python3 --version)"
echo ""

# Check if pip exists
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install Python 3.9+"
    exit 1
fi

echo "Installing Python dependencies..."
echo "(This may take 5-10 minutes on first run due to ML model downloads)"
echo ""

pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Dependencies installed successfully!"
    echo ""
    echo "Starting Flask backend server..."
    echo "Server will run on http://localhost:5000"
    echo ""
    echo "Keep this window open while using the app."
    echo "To stop: Press Ctrl+C"
    echo ""
    python3 app.py
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

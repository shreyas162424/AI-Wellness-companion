#!/bin/bash

echo "=================================="
echo "Health Companion - Frontend Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"
echo ""

# Check if npm exists
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js v18+"
    exit 1
fi

echo "Installing Node.js dependencies..."
echo ""

npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Dependencies installed successfully!"
    echo ""
    echo "Starting Next.js development server..."
    echo "Frontend will run on http://localhost:3000"
    echo ""
    echo "Keep this window open while using the app."
    echo "To stop: Press Ctrl+C"
    echo ""
    npm run dev
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

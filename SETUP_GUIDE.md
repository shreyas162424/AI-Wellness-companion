# Smart Health Companion - Setup & Run Guide

## Overview
This app consists of two parts:
1. **Frontend** (Next.js React app) - The web interface
2. **Backend** (Python Flask API) - Audio processing & AI analysis

Both need to be running simultaneously for the app to work.

---

## Prerequisites

### Required Software
- **Node.js** (v18+): https://nodejs.org/
- **Python** (v3.9+): https://www.python.org/

### Hardware
- Microphone (for audio recording)
- At least 4GB RAM (for Python ML model)
- Internet connection (for first-time model download)

---

## Quick Start (3 Steps)

### Step 1: Start Backend (Terminal 1)
\`\`\`bash
# Mac/Linux
chmod +x start-backend.sh
./start-backend.sh

# Windows
start-backend.bat
\`\`\`

### Step 2: Start Frontend (Terminal 2 - Keep backend running)
\`\`\`bash
# Mac/Linux
chmod +x start-frontend.sh
./start-frontend.sh

# Windows
start-frontend.bat
\`\`\`

### Step 3: Open Browser
\`\`\`
http://localhost:3000
Email: demo@wellness.com
Password: password123
\`\`\`

---

## Manual Setup (If Scripts Don't Work)

### Backend Setup

**Terminal 1:**
\`\`\`bash
pip install -r requirements.txt
python app.py
\`\`\`

Expected output: `Running on http://0.0.0.0:5000`

### Frontend Setup

**Terminal 2 (keep backend running):**
\`\`\`bash
npm install
npm run dev
\`\`\`

Expected output: `Local: http://localhost:3000`

---

## Testing

1. Login to http://localhost:3000
2. Go to Dashboard
3. Click **"Start Recording"**
4. Speak for 5-10 seconds
5. Click **"Stop Recording"**
6. Wait for analysis (~5-30 seconds)

**Expected Results:**
✓ Wellness Score (0-100)
✓ Stress Level
✓ Energy Level  
✓ Emotions Detected
✓ AI Recommendations

---

## Troubleshooting

### Backend Issues

**"Port 5000 already in use"**
\`\`\`bash
# Mac/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
\`\`\`

**"Module not found"**
\`\`\`bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
\`\`\`

**"Model takes forever to load"**
This is normal! First run downloads ~1GB. Subsequent runs are instant.

---

### Frontend Issues

**"Cannot GET /dashboard"**
1. Make sure you're logged in
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try again

**Microphone access denied**
1. Chrome: Settings → Privacy → Microphone → Allow
2. Firefox: Preferences → Privacy → Microphone → Allow

**"Failed to analyze"**
1. Check backend is running: http://localhost:5000/health
2. Check browser console (F12)
3. Verify both running on localhost

---

## File Structure

\`\`\`
project-root/
├── app.py                    # Python backend (MUST RUN)
├── requirements.txt          # Python dependencies
├── start-backend.sh/bat      # Backend startup scripts
├── start-frontend.sh/bat     # Frontend startup scripts
├── SETUP_GUIDE.md            # This file
├── app/
│   ├── api/analyze/route.ts  # Calls Python backend
│   ├── dashboard/            # Main app
│   └── auth/                 # Login/signup
├── components/               # React components
└── package.json
\`\`\`

---

## Architecture

\`\`\`
Browser (localhost:3000)
    ↓ (audio file)
Next.js Frontend
    ↓
/api/analyze endpoint
    ↓ (forwards to Python)
Python Backend (localhost:5000)
    ↓ (ML processing)
Analysis Results
    ↓
Frontend displays results
\`\`\`

---

## Quick Reference

**Check if backend is running:**
Open http://localhost:5000/health in browser

**Check if frontend is running:**
Open http://localhost:3000 in browser

**Demo credentials:**
- Email: demo@wellness.com
- Password: password123

---

## Support Checklist

- [ ] Python v3.9+ installed
- [ ] Node.js v18+ installed
- [ ] Backend running on localhost:5000
- [ ] Frontend running on localhost:3000
- [ ] Can login with demo credentials
- [ ] Can record and get analysis results

**If all checked ✓ - You're ready!** 🚀

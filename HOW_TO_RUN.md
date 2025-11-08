# How to Run and View the Application

## Quick Start (Windows)

### Step 1: Install Dependencies (First Time Only)

Open PowerShell or Command Prompt in the project folder and run:

```bash
npm install
```

This will install all required Node.js packages.

### Step 2: Start the Development Server

Run this command:

```bash
npm run dev
```

Or simply double-click `start-frontend.bat` file.

### Step 3: Open in Browser

Once the server starts, you'll see:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

Open your browser and go to:
**http://localhost:3000**

## Login Credentials

- **Email:** `demo@wellness.com`
- **Password:** `password123`

## What You'll See

1. **Home Page** - Landing page with app information
2. **Login Page** - Sign in with the demo credentials above
3. **Dashboard** - Your wellness monitoring dashboard where you can:
   - Record audio for wellness analysis
   - View wellness scores and trends
   - See personalized suggestions
   - Track your progress over time

## Using the App

1. Click **"Sign In"** on the home page
2. Enter the demo credentials
3. You'll be redirected to the dashboard
4. Click **"Start Recording"** to record your voice
5. Speak for 5-10 seconds
6. Click **"Stop Recording"** to analyze
7. View your wellness insights!

## Troubleshooting

### Port 3000 Already in Use
If you see "Port 3000 is already in use":
1. Close any other applications using port 3000
2. Or change the port by running: `npm run dev -- -p 3001`
3. Then access the app at http://localhost:3001

### Dependencies Not Installing
Make sure you have Node.js installed (v18 or higher):
- Download from: https://nodejs.org/
- Verify installation: `node --version`

### Can't Access the App
1. Make sure the dev server is running (you should see "Ready" message)
2. Check that you're using the correct URL: http://localhost:3000
3. Try clearing your browser cache

## Stopping the Server

Press `Ctrl + C` in the terminal where the server is running.

## Notes

- The app works offline (no backend required for basic functionality)
- Audio analysis will use fallback mode if backend is not available
- All data is stored locally in your browser


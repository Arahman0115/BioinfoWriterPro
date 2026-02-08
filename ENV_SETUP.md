# Environment Setup Guide

This guide will help you set up environment variables for BioinfoWriterPro.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your actual values** (see sections below)

3. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## Environment Variables

### Backend API URL

**Variable:** `VITE_API_URL`

**What it is:** URL of your backend API server

**Get it from:**
- **Local Development:** `http://localhost:5000` (or whatever port your backend runs on)
- **Render Deployment:** Copy from your Render dashboard
  - Go to https://dashboard.render.com
  - Select your service
  - Copy the "Web Service" URL
- **Heroku Deployment:** Copy from your Heroku app
  - Go to https://dashboard.heroku.com/apps
  - Select your app
  - Copy the URL from the top

**Example:**
```
VITE_API_URL=http://localhost:5000
VITE_API_URL=https://bioinfo-writer-api.onrender.com
```

---

### Firebase Configuration

Firebase provides all authentication, database, and storage services. You need to:

1. **Go to Firebase Console:** https://console.firebase.google.com
2. **Create a project or select existing one**
3. **Find your credentials:**
   - Click the gear icon (Project Settings) in top-left
   - Go to "Your apps" section
   - Under "Web" apps, find your app
   - Copy the config object
   - Click "Show" to reveal hidden values

#### Individual Variables

| Variable | Description | Found in |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Public API key for authentication | firebaseConfig.apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth service domain | firebaseConfig.authDomain |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID | firebaseConfig.projectId |
| `VITE_FIREBASE_STORAGE_BUCKET` | Cloud Storage bucket | firebaseConfig.storageBucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID for messaging | firebaseConfig.messagingSenderId |
| `VITE_FIREBASE_APP_ID` | Unique app identifier | firebaseConfig.appId |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics ID (optional) | firebaseConfig.measurementId |

**Example Firebase config from console:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "my-project.firebaseapp.com",
  projectId: "my-project",
  storageBucket: "my-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890ghij",
  measurementId: "G-XXXXXXXXXX"
};
```

**Copy these values to `.env.local`:**
```
VITE_FIREBASE_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-project
VITE_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890ghij
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Setup Instructions by Platform

### Local Development

**Backend:**
1. Start your backend server
2. Note the URL (usually `http://localhost:5000`)
3. Add to `.env.local`: `VITE_API_URL=http://localhost:5000`

**Firebase:**
1. Use same Firebase project as production
2. Or create a separate development Firebase project
3. Add all Firebase variables to `.env.local`

**Test:**
```bash
npm run dev
# Should see "Environment validation passed" in console
```

### Render.com (Recommended for Backend)

**Backend Deployment:**
1. Push code to GitHub
2. Create New → Web Service
3. Connect GitHub repo
4. Set environment variables in Render dashboard
5. Copy the generated URL

**Frontend (with this app):**
1. Create `.env.local` with Render backend URL
2. Test locally first
3. Can also deploy frontend to Render if needed

### Heroku (Alternative for Backend)

**Backend Deployment:**
1. Push code to GitHub
2. Go to https://dashboard.heroku.com
3. Create New App
4. Connect GitHub repo
5. Set environment variables in Settings → Config Vars
6. Copy the app URL

**Frontend (with this app):**
1. Create `.env.local` with Heroku backend URL
2. Test locally first

### Vercel (For Frontend)

If deploying this frontend to Vercel:

1. Push to GitHub
2. Create New Project in Vercel
3. Add environment variables in Settings → Environment Variables
4. Make sure to set for all environments (Development, Preview, Production)

---

## Validation

The app validates environment variables on startup. You'll see:

**Success:**
```
Environment validation passed
```

**Error:**
```
Missing configuration: VITE_API_URL, VITE_FIREBASE_API_KEY
```

If you see errors:
1. Check `.env.local` file exists
2. Verify all required values are filled in
3. Restart dev server: `npm run dev`
4. Check browser console for details

---

## Security Notes

🔒 **Important:**
- **NEVER** commit `.env.local` or `.env` files to git
- **NEVER** share your Firebase credentials or API keys publicly
- **NEVER** hardcode secrets in component files
- The `.gitignore` file already excludes `*.local` and `.env` files
- If keys are accidentally committed, regenerate them immediately

**API Key Security:**
- Firebase API keys are PUBLIC and meant for client-side use
- They're restricted by Firebase security rules, not by the key itself
- Set proper Firestore and Storage security rules in Firebase Console
- Enable authentication on all sensitive operations

---

## Troubleshooting

### "Missing required environment variables"

**Solution:**
1. Check if `.env.local` exists
2. Verify file is in project root (same level as `package.json`)
3. Restart dev server after creating/editing `.env.local`
4. Check for typos in variable names

### "Network error" or "API URL not configured"

**Solution:**
1. Verify `VITE_API_URL` is set correctly
2. Ensure backend server is running
3. Check URL is `http://` or `https://` (not `localhost:5000` alone)
4. Test URL in browser to verify it's accessible

### Firebase authentication not working

**Solution:**
1. Verify all Firebase variables are filled in
2. Check Firebase Console → Authentication → Sign-in methods
3. Ensure Google OAuth is enabled if using Google login
4. Check Firebase security rules allow user registration

### Timeout errors

**Solution:**
- Default API timeout: 10 seconds
- Bioinformatics tools timeout: 5 minutes
- If backend is slow, increase timeout in `/src/utils/apiClient.js`
- Check backend server is responsive

---

## Example `.env.local` for Local Development

```bash
# Backend - assuming local dev server
VITE_API_URL=http://localhost:5000

# Firebase - replace with your actual values
VITE_FIREBASE_API_KEY=AIzaSyDmyfirebaseapikey1234567890
VITE_FIREBASE_AUTH_DOMAIN=my-bioinfo-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-bioinfo-project
VITE_FIREBASE_STORAGE_BUCKET=my-bioinfo-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Need Help?

1. Check Firebase Console: https://console.firebase.google.com
2. Check Render Dashboard: https://dashboard.render.com (if using)
3. Check browser DevTools Console for error messages
4. Review `ENV_SETUP.md` (this file)

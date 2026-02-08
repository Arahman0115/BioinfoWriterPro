# Firebase Diagnostic Guide

If you're experiencing issues with saving or retrieving data, follow this diagnostic checklist.

## 🔍 Step 1: Check Console Logs

Open your browser's **Developer Console** (F12 or Cmd+Opt+I) and check for:

1. **Firebase initialization errors**
   - Should see green 🔥 Firebase logs for every operation
   - Look for ❌ Firebase Error messages

2. **Copy any error codes** you see (e.g., `permission-denied`, `unauthenticated`, etc.)

## ✅ Step 2: Verify Environment Variables

Make sure your `.env.local` file has ALL these variables:

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**To find these values:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon ⚙️ → Project Settings
4. Go to "Your apps" section
5. Click your Web app
6. Copy all values from the configuration

## 🔐 Step 3: Check Firestore Security Rules

This is the MOST COMMON cause of Firebase issues.

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** (left sidebar)
4. Click **Rules** tab
5. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;

      match /projects/{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

6. Click **Publish**

## 🔑 Step 4: Verify Authentication

1. Make sure you're **logged in** with Google
2. Go to Firebase Console → Authentication
3. You should see your email listed under "Users"

## 📊 Step 5: Check Firestore Database

1. Go to Firebase Console → Firestore Database
2. You should see a collection structure like:
   ```
   users/
     └── [your-uid]/
           └── projects/
                 └── [project-documents]
   ```

3. If you don't see any `users` collection, that's the problem - nothing is being saved!

## 🧪 Step 6: Test Save Functionality

1. Go to your app and create a new document in the Writer
2. Check the browser console (F12)
3. You should see a green log: `🔥 Firebase: addDoc-success`
4. If you see red ❌ errors instead, copy the error code

## 💡 Common Issues & Solutions

| Issue | Error Code | Solution |
|-------|-----------|----------|
| Rules don't allow your user | `permission-denied` | Update Firestore rules (Step 3) |
| User not authenticated | `unauthenticated` | Login with Google first |
| Wrong collection path | `not-found` | Check collection paths in code |
| Firebase not initialized | N/A | Verify .env.local has all variables |
| Offline/No connection | `unavailable` | Check internet connection |

## 📝 Quick Debug Checklist

- [ ] Browser console shows green 🔥 logs (not red errors)
- [ ] User is logged in (see profile in sidebar)
- [ ] .env.local has all 7 Firebase variables filled in
- [ ] Firestore Rules published (see code above)
- [ ] Firestore Database shows `users/{uid}/projects` collection
- [ ] Creating new document shows success log in console

## 🆘 Still Stuck?

If after following these steps you still have issues:

1. **Screenshot the error** from the browser console
2. **Check Firebase Console** for any error messages in:
   - Firestore → Rules → Deploy history
   - Authentication → Settings
   - Firestore → Data (verify structure exists)

3. **Restart the dev server**: Stop `npm run dev` and run it again

4. **Clear browser cache**: Open DevTools → Network tab → Disable cache → Reload

## 🚀 Testing Framework

The app now logs all Firebase operations. When working:
- ✅ Successful operations show: `🔥 Firebase: [operation]-success`
- ❌ Errors show: `❌ Firebase Error: [operation]` with error code

Use these logs to diagnose issues quickly!

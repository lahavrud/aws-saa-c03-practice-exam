# Complete Firebase Setup Guide

## Overview

This guide covers everything you need to set up Firebase with Google Sign-In for the AWS SAA-C03 Practice Exam app.

---

## Step 1: Create Firebase Project

1. Go to **https://console.firebase.google.com/**
2. Sign in with your Google account
3. Click **"Add project"**
4. Enter project name: `aws-saa-c03-practice` (or any name)
5. Click **Continue**
6. **Uncheck** "Enable Google Analytics" (not needed)
7. Click **Create project**
8. Wait ~30 seconds, then click **Continue**

---

## Step 2: Enable Firestore Database

1. Click **"Firestore Database"** in left menu
2. Click **"Create database"**
3. Choose **"Start in test mode"**
4. Click **Next**
5. Choose location (closest to your users)
6. Click **Enable**

---

## Step 3: Enable Google Sign-In

1. Click **"Authentication"** in left menu
2. Click **"Get started"** (if first time)
3. Click **"Sign-in method"** tab
4. Find **"Google"** → Click it
5. Toggle **"Enable"** to ON
6. Set **Project support email** (your email)
7. Click **"Save"**

---

## Step 4: Set Up Security Rules

Go to **Firestore Database** → **Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only access their own data by email
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.token.email != null &&
        (resource == null || resource.data.email == request.auth.token.email);
      allow create: if request.auth != null && 
        request.auth.token.email != null &&
        request.resource.data.email == request.auth.token.email;
    }
    
    // Progress collection - users can only access their own progress
    match /progress/{progressId} {
      allow read, write: if request.auth != null && 
        request.auth.token.email != null &&
        (resource == null || resource.data.userEmail == request.auth.token.email);
      allow create: if request.auth != null && 
        request.auth.token.email != null &&
        request.resource.data.userEmail == request.auth.token.email;
    }
    
    // User list - disabled (using email-based auth)
    match /userList/{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **"Publish"**.

---

## Step 5: Get Firebase Config

1. Click **⚙️ Settings** → **Project settings**
2. Scroll to **"Your apps"** section
3. Click **Web icon** (`</>`) or **"Add app"** → Web
4. Register app:
   - App nickname: `AWS SAA-C03 Practice`
   - **Uncheck** "Also set up Firebase Hosting"
   - Click **"Register app"**
5. **Copy the `firebaseConfig` object**

---

## Step 6: Create Config File

1. Copy example: `cp firebase-config.example.js firebase-config.js`
2. Open `firebase-config.js`
3. Paste your Firebase config values
4. **Save** (file is gitignored)

---

## Step 7: Restrict API Key (Security)

1. **Google Cloud Console**: https://console.cloud.google.com/
2. Select project: **aws-project-4f841**
3. Go to **APIs & Services** → **Credentials**
4. Click your **Web API Key** (`AIzaSy...`)
5. **Application restrictions** → **HTTP referrers**:
   - Add: `http://localhost/*`
   - Add: `http://localhost:8000/*`
   - Add: `https://yourusername.github.io/*`
   - Add: `https://aws-project-4f841.firebaseapp.com/*` (for Google Sign-In popup)
6. **API restrictions** → **Restrict key**:
   - Check: **Identity Toolkit API**
   - Check: **Cloud Firestore API**
7. Click **"Save"**

---

## Step 8: Test

1. Refresh your app
2. Click **"Sign in with Google"**
3. Sign in with your Gmail
4. You should see the main dashboard!

---

## Troubleshooting

### "403 Forbidden" Error
→ Add `https://aws-project-4f841.firebaseapp.com/*` to API key restrictions

### "Missing or insufficient permissions"
→ Update Firestore security rules (Step 4)

### Sign-in popup blocked
→ Check API key restrictions include Firebase domain

---

## Security Notes

- ✅ API key restrictions protect from unauthorized use
- ✅ Security rules protect your data
- ✅ Email-based access control
- ✅ Config file is gitignored

---

**That's it!** Your app now uses Google Sign-In with Firebase. 🎉

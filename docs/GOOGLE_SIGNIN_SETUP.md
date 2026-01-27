# Google Sign-In Setup Guide

## Step 1: Enable Google Sign-In in Firebase

1. Go to **Firebase Console**: https://console.firebase.google.com/
2. Select your project: **aws-project-4f841**
3. Go to **Authentication** → **Sign-in method**
4. Find **"Google"** in the list
5. Click on **"Google"**
6. Toggle **"Enable"** to ON
7. Set **Project support email** (your email)
8. Click **"Save"**

**Important**: You can now **disable Anonymous authentication** if you want (optional).

---

## Step 2: Update Security Rules

Go to **Firestore Database** → **Rules** and update to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only access their own data by email
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.token.email != null &&
        resource.data.email == request.auth.token.email;
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
    
    // User list - no longer needed with email-based auth
    match /userList/{document=**} {
      allow read, write: if false; // Disabled - using email-based auth
    }
  }
}
```

---

## Step 3: Test It

1. Refresh your app
2. You should see "Sign in with Google" button
3. Click it and sign in with your Gmail
4. Your data will be linked to your email automatically

---

## Migration Notes

### Existing Data

If you have existing anonymous users:
- They won't be accessible after switching to Google Sign-In
- You can either:
  1. **Start fresh** (recommended for testing)
  2. **Migrate data** (complex, requires manual mapping)

For a practice exam app, starting fresh is usually fine.

---

## What Changed

- ✅ **Authentication**: Google Sign-In only (no anonymous)
- ✅ **User ID**: Email address (instead of username)
- ✅ **Security**: Email-based access control
- ✅ **Cross-browser**: Works automatically (same email = same user)

---

## Benefits

1. **Real user identity** - No fake/anonymous users
2. **Better security** - Email-based access control
3. **Automatic sync** - Same email = same data across browsers
4. **No user selection** - Sign in and go!

# Firebase Setup Instructions

## 🔥 Firestore Database Rules (Required for Free Tier)

Go to your [Firebase Console](https://console.firebase.google.com/) → **Firestore Database** → **Rules** and paste:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## � Realtime Database Rules (Required for bug reports & presence)

Go to **Realtime Database** → **Rules** and paste:

```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "stats": {
      ".read": true,
      ".write": true
    },
    "registeredUsers": {
      ".read": true,
      ".write": "auth != null"
    },
    "bugReports": {
      ".read": "auth != null",
      "$reportId": {
        ".write": "auth != null"
      }
    },
    "bugReportCounts": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

## �🔐 Authentication Setup (Required)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **cf-upsolve**
3. Go to **Authentication** → **Sign-in method**
4. Enable **Anonymous** authentication
5. Click **Save**

## 📊 Firestore Database Setup

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll add custom rules above)
4. Select a region close to you (e.g., `us-central`)
5. Click **Enable**

## 🚀 Your App is Ready!

The app now:
- ✅ Uses Firebase Firestore instead of localStorage
- ✅ Authenticates users anonymously (no sign-up needed)
- ✅ Syncs data across devices with the same anonymous user
- ✅ Is optimized for Firebase free tier
- ✅ Each user gets their own isolated data

## 📝 Free Tier Limits

Firebase free tier includes:
- **Firestore:** 50,000 reads/day, 20,000 writes/day
- **Authentication:** Unlimited anonymous users
- **Storage:** 1 GB total

Your app is well within these limits! 🎉

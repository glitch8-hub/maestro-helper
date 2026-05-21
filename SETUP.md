# Setup Guide

This guide walks through getting Maestro Director's Helper running on GitHub Pages with cross-device sync via Firebase. Total time: about 30-45 minutes the first time.

There are four stages:

1. **Get the project files onto GitHub**
2. **Set up Firebase** (the cloud database)
3. **Add Firebase secrets to GitHub** so the deploy can use them
4. **Enable GitHub Pages** so your app gets a URL

---

## Stage 1: Get the project onto GitHub

Done via web upload, file by file. If you need to redo this, ask Claude for a different approach.

### Test it runs locally

```
npm install
npm run dev
```

Opens at http://localhost:5173/maestro-helper/. Without Firebase set up yet, it'll work using browser local storage only - no sync across devices.

---

## Stage 2: Set up Firebase

Firebase is Google's free backend service. We're using just the Firestore database part. Free tier covers 50,000 reads and 20,000 writes per day, far more than you'll ever use.

### 2a. Create a Firebase project

1. Go to https://console.firebase.google.com/
2. Sign in with a Google account (any will do)
3. Click **Add project**
4. Project name: `maestro-helper` (or whatever you want - it's just a label)
5. Disable Google Analytics when asked (you don't need it)
6. Wait ~30 seconds for the project to provision

### 2b. Add a web app to the project

1. On the project home screen, click the **web icon** (`</>`) under "Get started by adding Firebase to your app"
2. App nickname: `Maestro Helper Web`
3. **Don't** check "Also set up Firebase Hosting"
4. Click **Register app**
5. You'll see a code snippet with `firebaseConfig = { apiKey: "...", authDomain: "...", ... }`
6. **Copy these values somewhere** - you'll paste them into GitHub secrets in Stage 3
7. Click **Continue to console**

### 2c. Enable Firestore

1. In the left sidebar, click **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (important - this gives open read/write for 30 days; we'll lock it down at the end)
4. Pick a location close to you (e.g., `nam5 (us-central)` works fine from Canada)
5. Click **Enable**

### 2d. Set up security rules

While we're in Firestore, click the **Rules** tab and replace the contents with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write only to the specific workspace path used by the app.
    // Anyone with the workspace ID can read/write, but they need to know it.
    match /workspaces/wayward-main/{document=**} {
      allow read, write: if true;
    }
  }
}
```

Click **Publish**. Now your Firestore is locked down to just the one workspace path.

> **Security note:** This setup uses a shared workspace ID as a soft secret. Anyone who knows the workspace name (`wayward-main`) AND your project's API key can read/write your data. The API key is public (it's baked into the published JS). The data isn't sensitive (it's improv game preferences), so this is fine for a small-team tool. If you ever need stronger auth, ask for the Firebase Anonymous Auth setup.

---

## Stage 3: Add Firebase secrets to GitHub

GitHub builds the app every time you push, and it needs to know your Firebase config. We pass it as **repo secrets** so the values aren't visible in the public code.

1. Go to your repo on GitHub: `https://github.com/glitch8-hub/maestro-helper`
2. Click **Settings** (top right of the repo)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** and add each of these one at a time. The names must match exactly. Values come from the Firebase config you copied in step 2b:

| Secret name | Value from Firebase config |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_WORKSPACE_ID` | `wayward-main` |

That last one (`VITE_WORKSPACE_ID`) is the namespace your data lives under. Use `wayward-main` to match the security rule above, or pick something else and update both places.

---

## Stage 4: Enable GitHub Pages

1. In the repo, go to **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. That's it - save isn't needed.

Now trigger a deploy:

1. Go to the **Actions** tab on the repo
2. Click the **Deploy to GitHub Pages** workflow on the left
3. Click **Run workflow** → **Run workflow** (or just push any commit; it auto-runs on push to `main`)
4. Wait about 90 seconds. When it's green, your app is live at:
   - `https://glitch8-hub.github.io/maestro-helper/`

Open that URL on your phone, tablet, and laptop. Bookmark it. Add it to your home screen on mobile (Safari: Share → Add to Home Screen; Chrome: ⋮ menu → Add to Home Screen) and it behaves like an installed app.

---

## How sync works

Whenever the app saves data (you add a player, mark a game played, edit the format, etc.), it writes to a Firestore document under `workspaces/wayward-main/kv/`. Whenever the app starts, it reads from there. Every device pointing at the same workspace sees the same data.

The app also mirrors writes to the browser's localStorage. If you're offline, the cached data still loads, you can still use the app, and it syncs back to Firestore when you're online.

---

## Troubleshooting

**"Firebase not configured, using localStorage" in the browser console:**
Your env vars aren't loading. Check that the GitHub secrets are spelled exactly as in the table above. Tip: `import.meta.env.VITE_*` is a Vite thing - the `VITE_` prefix is required.

**GitHub Actions build fails:**
Check the Actions tab for the error. Most common cause: a missing secret.

**Data isn't syncing between devices:**
Open the browser console (F12) and look for "Firestore initialized, workspace: ...". If you see "Firebase not configured" instead, the env vars aren't reaching the build.

**404 on the deployed URL:**
The repo needs to be public. Also: it takes 30-90 seconds for a freshly enabled Pages site to start serving.

**Want to share with a co-director:**
Just give them the URL. They'll see the same data because they're hitting the same workspace.

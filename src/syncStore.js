// syncStore.js
// Wraps Firestore for cross-device sync, with localStorage fallback when
// Firebase env vars aren't set. Exposes a window.storage API matching what
// the app already calls: get/set/delete/list.

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const WORKSPACE = import.meta.env.VITE_WORKSPACE_ID || 'wayward-main';

const firebaseConfigured = !!(cfg.apiKey && cfg.projectId && cfg.appId);

let db = null;
if (firebaseConfigured) {
  try {
    const app = initializeApp(cfg);
    db = getFirestore(app);
    console.log('[syncStore] Firestore initialized, workspace:', WORKSPACE);
  } catch (e) {
    console.error('[syncStore] Firebase init failed, falling back to localStorage:', e);
    db = null;
  }
} else {
  console.log('[syncStore] Firebase not configured, using localStorage. Add VITE_FIREBASE_* env vars to enable cross-device sync.');
}

// Encode a key for use as a Firestore document ID. Firestore disallows '/' in IDs.
function encodeKey(key) {
  return key.replace(/[/]/g, '__');
}

// localStorage prefix for the same key space
const LS_PREFIX = '__maestro_helper__';

// LocalStorage backend
const localBackend = {
  async get(key) {
    const v = localStorage.getItem(LS_PREFIX + key);
    if (v === null) return null;
    return { key, value: v, shared: false };
  },
  async set(key, value) {
    localStorage.setItem(LS_PREFIX + key, value);
    return { key, value, shared: false };
  },
  async delete(key) {
    localStorage.removeItem(LS_PREFIX + key);
    return { ke

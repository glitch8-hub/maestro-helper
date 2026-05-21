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
    return { key, deleted: true, shared: false };
  },
  async list(prefix) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_PREFIX)) {
        const bare = k.slice(LS_PREFIX.length);
        if (!prefix || bare.startsWith(prefix)) keys.push(bare);
      }
    }
    return { keys, prefix, shared: false };
  },
};

// Firestore backend
const firestoreBackend = {
  async get(key) {
    try {
      const ref = doc(db, 'workspaces', WORKSPACE, 'kv', encodeKey(key));
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data();
      return { key, value: data.value, shared: false };
    } catch (e) {
      console.error('[syncStore] get failed for', key, e);
      // Fall back to local on error
      return localBackend.get(key);
    }
  },
  async set(key, value) {
    try {
      const ref = doc(db, 'workspaces', WORKSPACE, 'kv', encodeKey(key));
      await setDoc(ref, { value, updatedAt: Date.now() });
      // Also mirror to localStorage for offline reads
      localStorage.setItem(LS_PREFIX + key, value);
      return { key, value, shared: false };
    } catch (e) {
      console.error('[syncStore] set failed for', key, e);
      // Fall back to local on error
      return localBackend.set(key, value);
    }
  },
  async delete(key) {
    try {
      const ref = doc(db, 'workspaces', WORKSPACE, 'kv', encodeKey(key));
      await deleteDoc(ref);
      localStorage.removeItem(LS_PREFIX + key);
      return { key, deleted: true, shared: false };
    } catch (e) {
      console.error('[syncStore] delete failed for', key, e);
      return localBackend.delete(key);
    }
  },
  async list(prefix) {
    try {
      const ref = collection(db, 'workspaces', WORKSPACE, 'kv');
      const snap = await getDocs(ref);
      const keys = [];
      snap.forEach(d => {
        const decoded = d.id.replace(/__/g, '/');
        if (!prefix || decoded.startsWith(prefix)) keys.push(decoded);
      });
      return { keys, prefix, shared: false };
    } catch (e) {
      console.error('[syncStore] list failed:', e);
      return localBackend.list(prefix);
    }
  },
};

const backend = db ? firestoreBackend : localBackend;

// Install global so the app's existing window.storage.* calls work unchanged
if (typeof window !== 'undefined') {
  window.storage = backend;
}

export default backend;
export const isCloudSync = !!db;
export const workspaceId = WORKSPACE;

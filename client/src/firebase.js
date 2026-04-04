// ============================================================
// firebase.js — Firebase SDK initialisation
//
// HOW TO CONNECT YOUR FIREBASE:
//  1. Go to https://console.firebase.google.com
//  2. Create a project called "lifesaver-ai"
//  3. Add a Web App (</> icon)
//  4. Enable:
//       • Realtime Database (Start in test mode)
//       • Authentication (Anonymous or Email/Password)
//       • Cloud Messaging (for push notifications)
//  5. Copy your firebaseConfig object and paste below
//  6. Copy each value into client/.env (see .env.example)
// ============================================================

import { initializeApp }          from 'firebase/app'
import { getDatabase }            from 'firebase/database'
import { getMessaging }           from 'firebase/messaging'
import { getAuth, signInAnonymously } from 'firebase/auth'

// ── CONFIG (reads from .env) ─────────────────────────────────
// TODO: Create client/.env by copying .env.example and filling values
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
}

// ── INITIALISE ───────────────────────────────────────────────
let app, db, messaging, auth

try {
  // Only init if at least one required env var is present
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY') {
    app  = initializeApp(firebaseConfig)
    db   = getDatabase(app)
    auth = getAuth(app)

    // Auto sign-in anonymously so users don't need to log in for demo
    signInAnonymously(auth).catch(() => {})

    // Messaging only in browsers that support it (not Safari iOS)
    if ('Notification' in window && 'serviceWorker' in navigator) {
      messaging = getMessaging(app)
    }

    console.info('[Firebase] ✅ Connected')
  } else {
    console.warn('[Firebase] ⚠️  No config found – running in OFFLINE/DEMO mode')
  }
} catch (err) {
  console.error('[Firebase] ❌ Init error:', err)
}

export { app, db, messaging, auth }

// ── REALTIME DB PATHS (reference sheet) ──────────────────────
// /sos_events/{eventId}
//   └─ type:        "medical" | "women_safety" | "fire" | "flood" | "earthquake"
//   └─ lat:         number
//   └─ lng:         number
//   └─ timestamp:   ISO string
//   └─ status:      "active" | "resolved"
//   └─ userId:      string (anonymous uid)
//
// /helpers/{helperId}
//   └─ name:        string
//   └─ lat, lng:    number
//   └─ available:   boolean
//
// /alerts/{alertId}
//   └─ message:     string
//   └─ type:        emergency type
//   └─ lat, lng:    number
//   └─ timestamp:   ISO string

// Firebase initialization for VSS Textiles.
//
// All the actual project keys live in your local `.env` file (never
// committed — see `.env.example` for the list of variables to fill in).
// Get these values from the Firebase Console:
//   Project settings (gear icon) → General → "Your apps" → Web app → SDK
//   setup and configuration → Config
//
// Vite only exposes env vars that start with `VITE_` to the client, which
// is why every key below is prefixed that way.
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCElwg7IKraz4Q1ZpPxpucwRJtl_acOMg0",
  authDomain: "vsstexiles.firebaseapp.com",
  projectId: "vsstexiles",
  storageBucket: "vsstexiles.firebasestorage.app",
  messagingSenderId: "680043663548",
  appId: "1:680043663548:web:252d134c9b33a70f6a00b9",
  measurementId: "G-31C780SXJF"
};

// Guard against re-initializing during Vite's HMR.
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app

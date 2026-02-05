// Firebase configuration - Replace with your Firebase project config
// These are publishable keys and safe to include in client code
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-TWnLkkxRDJCj5FSUxDYB_C5Did0mSv0",
  authDomain: "earnwise-4e9a2.firebaseapp.com",
  projectId: "earnwise-4e9a2",
  storageBucket: "earnwise-4e9a2.firebasestorage.app",
  messagingSenderId: "944802224451",
  appId: "1:944802224451:web:3c0f0b73a90781cf2bf7f6",
  measurementId: "G-J3H1HZHEEH",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

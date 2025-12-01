import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBc2qt6LsrwYf2bqKaWnyJcq4lF6Zt8l0s",
  authDomain: "newsclub-905dc.firebaseapp.com",
  projectId: "newsclub-905dc",
  storageBucket: "newsclub-905dc.firebasestorage.app",
  messagingSenderId: "249607382076",
  appId: "1:249607382076:web:68ba7c78f6a0406a970f39",
  measurementId: "G-HFYVVY1Z2J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
};

export const logoutUser = async () => {
    await signOut(auth);
};
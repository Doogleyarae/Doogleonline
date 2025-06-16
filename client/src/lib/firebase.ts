import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA7jy7FNlH--Rkpd627WRvq5bikM1r7xVc",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "doogle-e-money"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "doogle-e-money",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "doogle-e-money"}.firebasestorage.app`,
  messagingSenderId: "478312672914",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:478312672914:web:placeholder-app-id",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export const loginWithGoogle = () => {
  try {
    signInWithRedirect(auth, provider);
  } catch (error: any) {
    if (error.code === 'auth/unauthorized-domain') {
      console.error('Domain not authorized. Please add your domain to Firebase Console > Authentication > Settings > Authorized domains');
      throw new Error('Authentication domain not configured. Please contact administrator.');
    }
    throw error;
  }
};

export const handleRedirectResult = () => {
  return getRedirectResult(auth);
};

export const logout = () => {
  return signOut(auth);
};

export const onAuthStateChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};
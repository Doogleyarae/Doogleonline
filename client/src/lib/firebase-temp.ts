// Temporary Firebase configuration for development
// This uses the project ID from your Google services file
// You'll need to provide the web app credentials for full functionality

import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA7jy7FNlH--Rkpd627WRvq5bikM1r7xVc", // From your Google services file
  authDomain: "doogle-e-money.firebaseapp.com",
  projectId: "doogle-e-money", // From your Google services file
  storageBucket: "doogle-e-money.firebasestorage.app",
  messagingSenderId: "478312672914", // From your Google services file
  appId: "1:478312672914:web:your-web-app-id" // You need to create a web app in Firebase Console
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export const loginWithGoogle = () => {
  signInWithRedirect(auth, provider);
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
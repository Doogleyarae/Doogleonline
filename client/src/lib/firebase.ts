import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";

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

// Email/Password Authentication
export const signUpWithEmail = async (email: string, password: string, fullName: string, rememberMe: boolean = false) => {
  try {
    // Set persistence based on remember me
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update user profile with full name
    if (userCredential.user && fullName) {
      await updateProfile(userCredential.user, {
        displayName: fullName
      });
    }
    
    return userCredential;
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string, rememberMe: boolean = false) => {
  try {
    // Set persistence based on remember me
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw error;
  }
};

// Google Authentication - using popup method for better compatibility
export const loginWithGoogle = async () => {
  try {
    // Set persistence for Google sign-in
    await setPersistence(auth, browserLocalPersistence);
    
    // Try popup method first (better for domain issues)
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Domain not authorized for Google Sign-In. Please add this domain to Firebase Console > Authentication > Settings > Authorized domains');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by browser. Please allow popups and try again.');
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in request is in progress. Please wait.');
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

// Helper function to get user-friendly error messages
export const getAuthErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    default:
      return 'An error occurred. Please try again.';
  }
};
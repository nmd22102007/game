/**
 * NURMD GAME HUB - Authentication Service Module
 * Handles Google Auth Popups, Email/Password Credentials creation & login, 
 * and Anonymous Guest Authentication sessions.
 */

import { 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  signOut,
  UserCredential
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

/**
 * Signs in the user using Google authentication popup.
 */
export async function loginWithGoogle(): Promise<UserCredential> {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Google Auth service error: ", error);
    throw error;
  }
}

/**
 * Signs in the user anonymously as a Guest.
 */
export async function loginAsGuest(): Promise<UserCredential> {
  try {
    return await signInAnonymously(auth);
  } catch (error) {
    console.error("Anonymous Guest Auth error: ", error);
    throw error;
  }
}

/**
 * Creates a new user profile with email and password, setting an initial username.
 */
export async function registerWithEmail(email: string, pass: string, name: string): Promise<UserCredential> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
    return cred;
  } catch (error) {
    console.error("Email registration error: ", error);
    throw error;
  }
}

/**
 * Signs in the user using traditional Email and Password credentials.
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(auth, email, pass);
  } catch (error) {
    console.error("Email Login Auth error: ", error);
    throw error;
  }
}

/**
 * Terminates the active authenticated user session.
 */
export async function logOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Log out Auth error: ", error);
    throw error;
  }
}

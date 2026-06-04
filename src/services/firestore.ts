/**
 * NURMD GAME HUB - FireStore Services Module
 * Handles high-integrity transactional schemas, real-time snapshot listeners, 
 * atomic structures alignment, and specific leaderboard timeframe bounds.
 */

import { 
  db, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection, 
  query, 
  orderBy, 
  limit, 
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';

/**
 * Fetches core profile data for a specific user.
 */
export async function fetchUserProfile(uid: string): Promise<DocumentSnapshot> {
  const path = `users/${uid}`;
  try {
    return await getDoc(doc(db, 'users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Creates/Saves user data into `users` collection.
 */
export async function saveUserProfile(
  uid: string, 
  data: { username: string; email: string; avatar: string; coins: number; totalScore: number; achievements: string[] }
) {
  const path = `users/${uid}`;
  try {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      uid,
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Submits a score entry to the `leaderboards` collection.
 */
export async function submitLeaderboardScore(uid: string, username: string, game: string, score: number) {
  const customId = `score_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const path = `leaderboards/${customId}`;
  try {
    await setDoc(doc(db, 'leaderboards', customId), {
      uid,
      username,
      game,
      score,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to leaderboard query updates in real-time.
 * Supports: 'global', 'weekly' (last 7 days), and 'monthly' (last 30 days) filters.
 */
export function listenToLeaderboard(
  timeframe: 'global' | 'weekly' | 'monthly', 
  callback: (snapshot: QuerySnapshot) => void, 
  errorCallback: (error: Error) => void
) {
  const path = 'leaderboards';
  const colRef = collection(db, 'leaderboards');
  let q = query(colRef, orderBy('score', 'desc'), limit(15));

  if (timeframe === 'weekly') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const ts = Timestamp.fromDate(sevenDaysAgo);
    q = query(colRef, where('createdAt', '>=', ts), orderBy('createdAt', 'desc'), limit(50));
  } else if (timeframe === 'monthly') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ts = Timestamp.fromDate(thirtyDaysAgo);
    q = query(colRef, where('createdAt', '>=', ts), orderBy('createdAt', 'desc'), limit(50));
  }

  return onSnapshot(q, callback, (error) => {
    // Process error securely
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch (e: any) {
      errorCallback(e);
    }
  });
}

/**
 * Syncs achievements, game progress settings, skins, or options maps to their respective collections.
 */
export async function syncUserDataPackage(collectionName: 'achievements' | 'gameProgress' | 'skins' | 'settings', uid: string, data: any) {
  const path = `${collectionName}/${uid}`;
  try {
    await setDoc(doc(db, collectionName, uid), {
      ...data,
      uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Starts a real-time listener for any user document of any collection.
 */
export function listenToUserDoc(
  collectionName: 'users' | 'achievements' | 'gameProgress' | 'skins' | 'settings', 
  uid: string, 
  callback: (snapshot: DocumentSnapshot) => void
) {
  const path = `${collectionName}/${uid}`;
  return onSnapshot(doc(db, collectionName, uid), callback, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

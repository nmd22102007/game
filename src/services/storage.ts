/**
 * NURMD GAME HUB - Storage Service Module
 * Handles Firebase Cloud Storage buckets upload/download hooks for user custom avatar files, 
 * graphics assets, and future static materials.
 */

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads a user custom avatar image onto the cloud storage bucket under matching user bounds.
 */
export async function uploadUserAvatar(uid: string, fileOrBlob: File | Blob): Promise<string> {
  const fileRef = ref(storage, `avatars/${uid}/${Date.now()}_avatar.png`);
  try {
    const uploadResult = await uploadBytes(fileRef, fileOrBlob, {
      contentType: 'image/png'
    });
    return await getDownloadURL(uploadResult.ref);
  } catch (error) {
    console.error("Firebase Storage avatar upload failed: ", error);
    throw error;
  }
}

/**
 * Loads a specified download URL path for a static asset ref name.
 */
export async function retrieveGameThumbnail(gameName: string): Promise<string> {
  const imgRef = ref(storage, `thumbnails/${gameName.toLowerCase().replace(/\s+/g, '_')}.png`);
  try {
    return await getDownloadURL(imgRef);
  } catch (error) {
    console.warn(`Could not fetch thumbnail for ${gameName}: `, error);
    // fallback or empty placeholder
    return '';
  }
}

/**
 * Deletes a previously uploaded file from the cloud bucket.
 */
export async function removeStorageFile(storagePath: string): Promise<void> {
  const fileRef = ref(storage, storagePath);
  try {
    await deleteObject(fileRef);
  } catch (error) {
    console.error(`Failed to delete storage asset at: ${storagePath}`, error);
    throw error;
  }
}

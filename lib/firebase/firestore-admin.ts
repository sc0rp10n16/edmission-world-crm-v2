// lib/firebase/firestore-admin.ts
import admin from 'firebase-admin';
import { User } from '../types/user';

const serviceKey = require('@/service_key.json');
// Initialize admin SDK (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceKey)
  });
}

const db = admin.firestore();
const USERS_COLLECTION = 'users';

// Get user by ID (admin version)
export async function getUserById(uid: string): Promise<User | null> {
  try {
    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    return userDoc.data() as User;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}
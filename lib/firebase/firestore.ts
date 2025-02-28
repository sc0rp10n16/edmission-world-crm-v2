
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User, UserRole } from '../types/user';
import { db } from '@/firebase';

const USERS_COLLECTION = 'users';

// Create a new user with role
export async function createUserWithRole(uid: string, userData: Omit<User, 'uid' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  
  const newUser: User = {
    uid,
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await setDoc(userRef, newUser);
}

// Get user by ID
export async function getUserById(uid: string): Promise<User | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return null;
  }
  
  return userSnap.data() as User;
}

// Update user role
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    role,
    updatedAt: new Date()
  });
}

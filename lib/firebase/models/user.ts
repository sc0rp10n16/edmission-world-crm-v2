import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { User, UserRole } from '../../types/user';
import { db } from '@/firebase';

// Collection reference
const USERS_COLLECTION = 'users';
const usersRef = collection(db, USERS_COLLECTION);

// Create a new user
export async function createUser(uid: string, userData: Omit<User, 'uid' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const now = new Date();
  
  const newUser: User = {
    uid,
    ...userData,
    createdAt: now,
    updatedAt: now
  };
  
  // Set the user document in Firestore
  await setDoc(doc(db, USERS_COLLECTION, uid), newUser);
  
  return newUser;
}

// Get a user by ID
export async function getUserById(uid: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
  
  if (!userDoc.exists()) {
    return null;
  }
  
  return userDoc.data() as User;
}

// Update a user
export async function updateUser(uid: string, userData: Partial<Omit<User, 'uid' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    ...userData,
    updatedAt: new Date()
  });
}

// Update a user's role
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    role,
    updatedAt: new Date()
  });
}

// Get users by role
export async function getUsersByRole(role: UserRole): Promise<User[]> {
  const q = query(usersRef, where('role', '==', role));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as User);
}

// Get users by team
export async function getUsersByTeam(teamId: string): Promise<User[]> {
  const q = query(usersRef, where('teamId', '==', teamId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as User);
}
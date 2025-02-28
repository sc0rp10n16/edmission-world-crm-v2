// services/teamService.ts
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  arrayUnion,
  arrayRemove,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Team, User } from '@/lib/types';


// Collection references
const TEAMS_COLLECTION = 'teams';
const USERS_COLLECTION = 'users';
const teamsRef = collection(db, TEAMS_COLLECTION);
const usersRef = collection(db, USERS_COLLECTION);

// Create a new team
export async function createTeam(name: string, managerId: string): Promise<Team> {
  // Create a new document with an auto-generated ID
  const docRef = doc(collection(db, TEAMS_COLLECTION));
  
  const now = new Date();
  
  const newTeam: Team = {
    id: docRef.id,
    name,
    managerId,
    members: [],
    createdAt: now,
    updatedAt: now
  };
  
  // Set the team document in Firestore
  await setDoc(docRef, {
    ...newTeam,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now)
  });
  
  return newTeam;
}

// Get a team by ID
export async function getTeamById(id: string): Promise<Team | null> {
  const teamDoc = await getDoc(doc(db, TEAMS_COLLECTION, id));
  
  if (!teamDoc.exists()) {
    return null;
  }
  
  const data = teamDoc.data();
  
  return {
    ...data,
    id: teamDoc.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate()
  } as Team;
}

// Update a team
export async function updateTeam(id: string, teamData: Partial<Omit<Team, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  await updateDoc(doc(db, TEAMS_COLLECTION, id), {
    ...teamData,
    updatedAt: serverTimestamp()
  });
}

// Add a member to a team
export async function addTeamMember(teamId: string, userId: string): Promise<void> {
  // Update the team document
  await updateDoc(doc(db, TEAMS_COLLECTION, teamId), {
    members: arrayUnion(userId),
    updatedAt: serverTimestamp()
  });
  
  // Update the user document
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    teamId,
    updatedAt: serverTimestamp()
  });
}

// Remove a member from a team
export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  // Update the team document
  await updateDoc(doc(db, TEAMS_COLLECTION, teamId), {
    members: arrayRemove(userId),
    updatedAt: serverTimestamp()
  });
  
  // Update the user document
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    teamId: null,
    updatedAt: serverTimestamp()
  });
}

// Get teams by manager
export async function getTeamsByManager(managerId: string): Promise<Team[]> {
  const q = query(teamsRef, where('managerId', '==', managerId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Team;
  });
}

// Get team members
export async function getTeamMembers(teamId: string): Promise<User[]> {
  const q = query(usersRef, where('teamId', '==', teamId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      uid: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as User;
  });
}

// Get telemarketers without a team
export async function getUnassignedTelemarketers(): Promise<User[]> {
  const q = query(
    usersRef, 
    where('role', '==', 'telemarketer'),
    where('teamId', '==', null)
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      uid: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as User;
  });
}

// Get all telemarketers
export async function getAllTelemarketers(): Promise<User[]> {
  const q = query(usersRef, where('role', '==', 'telemarketer'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      uid: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as User;
  });
}

// Get all sales managers
export async function getAllSalesManagers(): Promise<User[]> {
  const q = query(usersRef, where('role', '==', 'sales_manager'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      uid: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as User;
  });
}
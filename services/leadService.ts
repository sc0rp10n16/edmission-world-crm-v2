// services/leadService.ts
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  addDoc,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Lead, LeadStatus } from '@/lib/types';


// Collection reference
const LEADS_COLLECTION = 'leads';
const leadsRef = collection(db, LEADS_COLLECTION);

// Create a new lead
export async function createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>): Promise<Lead> {
  // Create a new document with an auto-generated ID
  const docRef = doc(collection(db, LEADS_COLLECTION));
  
  const now = new Date();
  
  const newLead: Lead = {
    id: docRef.id,
    ...leadData,
    notes: [],
    createdAt: now,
    updatedAt: now
  };
  
  // Set the lead document in Firestore
  await setDoc(docRef, {
    ...newLead,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now)
  });
  
  return newLead;
}

// Create multiple leads (used for CSV import)
export async function createLeads(leadsData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>[]): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;
  
  leadsData.forEach((leadData) => {
    const docRef = doc(collection(db, LEADS_COLLECTION));
    const now = new Date();
    
    const newLead = {
      id: docRef.id,
      ...leadData,
      notes: [],
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };
    
    batch.set(docRef, newLead);
    count++;
  });
  
  await batch.commit();
  return count;
}

// Get a lead by ID
export async function getLeadById(id: string): Promise<Lead | null> {
  const leadDoc = await getDoc(doc(db, LEADS_COLLECTION, id));
  
  if (!leadDoc.exists()) {
    return null;
  }
  
  const data = leadDoc.data();
  
  return {
    ...data,
    id: leadDoc.id,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate()
  } as Lead;
}

// Update a lead
export async function updateLead(id: string, leadData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  await updateDoc(doc(db, LEADS_COLLECTION, id), {
    ...leadData,
    updatedAt: serverTimestamp()
  });
}

// Update a lead's status
export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  await updateDoc(doc(db, LEADS_COLLECTION, id), {
    status,
    updatedAt: serverTimestamp()
  });
}

// Add a note to a lead
export async function addNoteToLead(id: string, note: string): Promise<void> {
  const leadDoc = await getDoc(doc(db, LEADS_COLLECTION, id));
  
  if (!leadDoc.exists()) {
    throw new Error(`Lead with ID ${id} not found`);
  }
  
  const data = leadDoc.data();
  const notes = data.notes || [];
  
  await updateDoc(doc(db, LEADS_COLLECTION, id), {
    notes: [...notes, note],
    updatedAt: serverTimestamp()
  });
}

// Assign a lead to a telemarketer
export async function assignLead(id: string, telemarketerId: string): Promise<void> {
  await updateDoc(doc(db, LEADS_COLLECTION, id), {
    assignedTo: telemarketerId,
    updatedAt: serverTimestamp()
  });
}

// Bulk assign leads to a telemarketer
export async function bulkAssignLeads(leadIds: string[], telemarketerId: string): Promise<void> {
  const batch = writeBatch(db);
  
  leadIds.forEach((id) => {
    const leadRef = doc(db, LEADS_COLLECTION, id);
    batch.update(leadRef, {
      assignedTo: telemarketerId,
      updatedAt: serverTimestamp()
    });
  });
  
  await batch.commit();
}

// Get leads by status
export async function getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
  const q = query(leadsRef, where('status', '==', status));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Lead;
  });
}

// Get leads assigned to a telemarketer
export async function getLeadsByTelemarketer(telemarketerId: string): Promise<Lead[]> {
  const q = query(leadsRef, where('assignedTo', '==', telemarketerId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Lead;
  });
}

// Get recent leads
export async function getRecentLeads(limitCount = 10): Promise<Lead[]> {
  const q = query(leadsRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Lead;
  });
}

// Get unassigned leads
export async function getUnassignedLeads(): Promise<Lead[]> {
  const q = query(leadsRef, 
    where('assignedTo', '==', null),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Lead;
  });
}

// Get lead statistics
export async function getLeadStatistics(): Promise<Record<LeadStatus, number>> {
  const statuses: LeadStatus[] = [
    'new',
    'in_progress',
    'follow_up_1',
    'follow_up_2',
    'follow_up_3',
    'qualified',
    'not_interested',
    'completed'
  ];
  
  const statistics: Record<LeadStatus, number> = {
    'new': 0,
    'in_progress': 0,
    'follow_up_1': 0,
    'follow_up_2': 0,
    'follow_up_3': 0,
    'qualified': 0,
    'not_interested': 0,
    'completed': 0
  };
  
  // This could be optimized with a more efficient query if needed
  for (const status of statuses) {
    const q = query(leadsRef, where('status', '==', status));
    const querySnapshot = await getDocs(q);
    statistics[status] = querySnapshot.size;
  }
  
  return statistics;
}
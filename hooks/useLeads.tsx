// hooks/useLeads.ts
'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  getDocs,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Lead, LeadStatus } from '@/lib/types';
import * as leadService from '@/services/leadService';

interface UseLeadsOptions {
  status?: LeadStatus;
  assignedTo?: string;
  limit?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

export function useLeads(options: UseLeadsOptions = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<LeadStatus, number> | null>(null);

  // Get all leads with optional filtering
  useEffect(() => {
    setLoading(true);
    
    // Build the query based on options
    let leadsQuery = collection(db, 'leads');
    let constraints = [];
    
    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }
    
    if (options.assignedTo) {
      constraints.push(where('assignedTo', '==', options.assignedTo));
    }
    
    if (options.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }
    
    if (options.limit) {
      constraints.push(limit(options.limit));
    }
    
    const q = query(leadsQuery, ...constraints);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const leadsData: Lead[] = snapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firestore Timestamps to JavaScript Date objects
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          } as Lead;
        });
        setLeads(leadsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching leads:', err);
        setError('Failed to fetch leads: ' + err.message);
        setLoading(false);
      }
    );
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [options.status, options.assignedTo, options.limit, options.orderByField, options.orderDirection]);
  
  // Load lead statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statistics = await leadService.getLeadStatistics();
        setStats(statistics);
      } catch (err: any) {
        console.error('Error fetching lead statistics:', err);
        setError(prev => prev || 'Failed to fetch lead statistics');
      }
    };
    
    loadStats();
  }, []);
  
  // Function to create a new lead
  const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => {
    try {
      return await leadService.createLead(leadData);
    } catch (err: any) {
      setError('Failed to create lead: ' + err.message);
      throw err;
    }
  };
  
  // Function to update a lead
  const updateLead = async (id: string, leadData: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      await leadService.updateLead(id, leadData);
    } catch (err: any) {
      setError('Failed to update lead: ' + err.message);
      throw err;
    }
  };
  
  // Function to update a lead's status
  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    try {
      await leadService.updateLeadStatus(id, status);
    } catch (err: any) {
      setError('Failed to update lead status: ' + err.message);
      throw err;
    }
  };
  
  // Function to assign a lead
  const assignLead = async (id: string, telemarketerId: string) => {
    try {
      await leadService.assignLead(id, telemarketerId);
    } catch (err: any) {
      setError('Failed to assign lead: ' + err.message);
      throw err;
    }
  };
  
  // Function to add a note to a lead
  const addNote = async (id: string, note: string) => {
    try {
      await leadService.addNoteToLead(id, note);
    } catch (err: any) {
      setError('Failed to add note: ' + err.message);
      throw err;
    }
  };
  
  // Function to upload leads from CSV
  const uploadLeads = async (leadsData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>[]) => {
    try {
      return await leadService.createLeads(leadsData);
    } catch (err: any) {
      setError('Failed to upload leads: ' + err.message);
      throw err;
    }
  };
  
  return {
    leads,
    loading,
    error,
    stats,
    createLead,
    updateLead,
    updateLeadStatus,
    assignLead,
    addNote,
    uploadLeads,
  };
}
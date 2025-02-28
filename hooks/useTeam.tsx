// hooks/useTeam.ts
'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Team, User, UserRole } from '@/lib/types';
import * as teamService from '@/services/teamService';
import { useFirebase } from '@/context/FirebaseContext';

export function useTeam() {
  const { user } = useFirebase();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get the team for a sales manager
  useEffect(() => {
    if (!user || user.role !== 'sales_manager') {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const loadTeam = async () => {
      try {
        // Get teams managed by this sales manager
        const teams = await teamService.getTeamsByManager(user.uid);
        if (teams.length > 0) {
          setTeam(teams[0]); // Assuming one team per sales manager for now
          
          // If we have a team, subscribe to team members
          const q = query(
            collection(db, 'users'),
            where('teamId', '==', teams[0].id)
          );
          
          const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const usersData: User[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  ...data,
                  uid: doc.id,
                  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
                } as User;
              });
              setMembers(usersData);
              setLoading(false);
              setError(null);
            },
            (err) => {
              console.error('Error fetching team members:', err);
              setError('Failed to fetch team members: ' + err.message);
              setLoading(false);
            }
          );
          
          return unsubscribe;
        } else {
          // No team found
          setTeam(null);
          setMembers([]);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching team:', err);
        setError('Failed to fetch team: ' + err.message);
        setLoading(false);
      }
    };
    
    loadTeam();
  }, [user]);

  // Get telemarketers without a team for potential addition
  const getAvailableTelemarketers = async () => {
    try {
      return await teamService.getUnassignedTelemarketers();
    } catch (err: any) {
      setError('Failed to get available telemarketers: ' + err.message);
      throw err;
    }
  };
  
  // Create a new team
  const createTeam = async (name: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      return await teamService.createTeam(name, user.uid);
    } catch (err: any) {
      setError('Failed to create team: ' + err.message);
      throw err;
    }
  };
  
  // Add a telemarketer to the team
  const addTeamMember = async (userId: string) => {
    if (!team) throw new Error('No team available');
    
    try {
      await teamService.addTeamMember(team.id, userId);
    } catch (err: any) {
      setError('Failed to add team member: ' + err.message);
      throw err;
    }
  };
  
  // Remove a telemarketer from the team
  const removeTeamMember = async (userId: string) => {
    if (!team) throw new Error('No team available');
    
    try {
      await teamService.removeTeamMember(team.id, userId);
    } catch (err: any) {
      setError('Failed to remove team member: ' + err.message);
      throw err;
    }
  };
  
  // Get performance metrics for the team members
  const getTeamPerformance = async () => {
    if (!team) return [];
    
    try {
      // In a real app, you would implement a separate service for performance metrics
      // This is a placeholder that returns dummy data structured properly
      return members.map(member => ({
        userId: member.uid,
        name: member.name,
        leadsAssigned: Math.floor(Math.random() * 30) + 10,
        leadsContacted: Math.floor(Math.random() * 20) + 5,
        leadsQualified: Math.floor(Math.random() * 10) + 2,
        conversionRate: Math.floor(Math.random() * 50) + 20,
        dailyTarget: 8,
        currentProgress: Math.floor(Math.random() * 8) + 1,
      }));
    } catch (err: any) {
      setError('Failed to get team performance: ' + err.message);
      throw err;
    }
  };
  
  return {
    team,
    members,
    loading,
    error,
    getAvailableTelemarketers,
    createTeam,
    addTeamMember,
    removeTeamMember,
    getTeamPerformance,
  };
}
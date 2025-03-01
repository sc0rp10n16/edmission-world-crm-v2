'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';

import { useRBAC } from '@/hooks/auth/useRBAC';
import { redirect } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronDown, ArrowUpDown, Plus, Edit, Trash2, Sparkles, Users, Star, Trophy, Award, AlertTriangle, X } from 'lucide-react';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/auth/useAuth';

export default function TeamOverviewPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamStats, setTeamStats] = useState<any>({});
  const [currentTab, setCurrentTab] = useState('overview');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({ key: 'name', direction: 'ascending' });
  
  // Form States
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
  });
  
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'telemarketer',
  });
  
  const { user } = useAuth();
  const { hasRole, loading } = useRBAC();

  // Fetch teams on initial load
  useEffect(() => {
    const fetchTeams = async () => {
      if (!user?.uid) return;
      
      try {
        setIsLoading(true);
        
        // Get teams managed by this sales manager
        const teamsQuery = query(
          collection(db, 'teams'),
          where('managerId', '==', user.uid)
        );
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          memberCount: 0, // Will be populated later
          leadCount: doc.data().totalLeads || 0,
          conversionRate: doc.data().totalLeads > 0 
            ? ((doc.data().convertedLeads || 0) / doc.data().totalLeads * 100).toFixed(1) 
            : '0'
        }));
        
        // Get member counts for each team
        for (const team of teamsData) {
          const membersQuery = query(
            collection(db, 'users'),
            where('teamId', '==', team.id)
          );
          const membersSnapshot = await getDocs(membersQuery);
          team.memberCount = membersSnapshot.docs.length;
        }
        
        setTeams(teamsData);
        
        // Select the first team by default if available
        if (teamsData.length > 0 && !selectedTeam) {
          setSelectedTeam(teamsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load teams');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeams();
  }, [user, selectedTeam]);
  
  // Fetch team members when a team is selected
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!selectedTeam) return;
      
      try {
        setIsLoading(true);
        
        const membersQuery = query(
          collection(db, 'users'),
          where('teamId', '==', selectedTeam)
        );
        const membersSnapshot = await getDocs(membersQuery);
        const membersData = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          conversionRate: doc.data().leadCount > 0 
            ? ((doc.data().leadsQualified || 0) / doc.data().leadCount * 100).toFixed(1) 
            : '0'
        }));
        
        // Sort members based on the current sort configuration
        const sortedMembers = sortMembers(membersData, sortConfig);
        setTeamMembers(sortedMembers);
        
        // Calculate team statistics
        const teamData = teams.find(team => team.id === selectedTeam);
        if (teamData) {
          const stats = {
            totalMembers: membersData.length,
            totalLeads: teamData.totalLeads || 0,
            convertedLeads: teamData.convertedLeads || 0,
            conversionRate: teamData.conversionRate,
            topPerformer: getTopPerformer(membersData),
            recentActivity: generateMockRecentActivity(),
            leadsByStatus: generateMockLeadsByStatus()
          };
          
          setTeamStats(stats);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        toast.error('Failed to load team members');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeamMembers();
  }, [selectedTeam, sortConfig, teams]);
  
  // Helper function to find top performer
  const getTopPerformer = (members: any[]) => {
    if (members.length === 0) return null;
    
    return members.reduce((top, member) => {
      return (parseFloat(member.conversionRate) > parseFloat(top.conversionRate)) ? member : top;
    }, members[0]);
  };
  
  // Mock data generators (replace with real data later)
  const generateMockRecentActivity = () => {
    return [
      { type: 'lead_added', count: 12, time: '2 hours ago' },
      { type: 'lead_converted', count: 3, time: '4 hours ago' },
      { type: 'follow_up_completed', count: 8, time: 'Today' },
      { type: 'new_member_added', count: 1, time: 'Yesterday' }
    ];
  };
  
  const generateMockLeadsByStatus = () => {
    return [
      { status: 'New', count: 24, color: '#3B82F6' },
      { status: 'In Progress', count: 38, color: '#F59E0B' },
      { status: 'Follow Up', count: 19, color: '#8B5CF6' },
      { status: 'Qualified', count: 15, color: '#10B981' },
      { status: 'Not Interested', count: 8, color: '#EF4444' }
    ];
  };
  
  // Sort function for team members
  const sortMembers = (members: any[], config: typeof sortConfig) => {
    return [...members].sort((a, b) => {
      if (a[config.key] < b[config.key]) {
        return config.direction === 'ascending' ? -1 : 1;
      }
      if (a[config.key] > b[config.key]) {
        return config.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };
  
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Create a new team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTeam.name) {
      toast.error('Team name is required');
      return;
    }
    
    try {
      // Create the team document
      const teamData = {
        name: newTeam.name,
        description: newTeam.description,
        managerId: user?.uid,
        createdAt: new Date(),
        totalLeads: 0,
        convertedLeads: 0
      };
      
      const docRef = await addDoc(collection(db, 'teams'), teamData);
      
      toast.success('Team created successfully');
      
      // Add new team to state
      setTeams([...teams, { id: docRef.id, ...teamData, memberCount: 0, leadCount: 0, conversionRate: '0' }]);
      
      // Select the new team
      setSelectedTeam(docRef.id);
      
      // Reset form and close dialog
      setNewTeam({ name: '', description: '' });
      setIsAddTeamOpen(false);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  };
  
  // Create a new team member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMember.name || !newMember.email || !selectedTeam) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      // Create the user document
      const userData = {
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        teamId: selectedTeam,
        createdAt: new Date(),
        leadCount: 0,
        leadsInProgress: 0,
        leadsQualified: 0,
        leadsNotInterested: 0,
        assignedLeads: []
      };
      
      const docRef = await addDoc(collection(db, 'users'), userData);
      
      toast.success('Team member added successfully');
      
      // Add the new member to state
      setTeamMembers([...teamMembers, { id: docRef.id, ...userData, conversionRate: '0' }]);
      
      // Update team member count
      const updatedTeams = teams.map(team => {
        if (team.id === selectedTeam) {
          return { ...team, memberCount: team.memberCount + 1 };
        }
        return team;
      });
      setTeams(updatedTeams);
      
      // Reset form and close dialog
      setNewMember({ name: '', email: '', role: 'telemarketer' });
      setIsAddMemberOpen(false);
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
    }
  };
  
  // Delete a team
  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    try {
      // Delete team document
      await deleteDoc(doc(db, 'teams', teamToDelete));
      
      toast.success('Team deleted successfully');
      
      // Remove from state
      const updatedTeams = teams.filter(team => team.id !== teamToDelete);
      setTeams(updatedTeams);
      
      // Update selected team if needed
      if (selectedTeam === teamToDelete) {
        setSelectedTeam(updatedTeams.length > 0 ? updatedTeams[0].id : null);
      }
      
      // Close confirmation dialog
      setShowDeleteConfirm(false);
      setTeamToDelete(null);
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };
  
  // Navigation guard
  if (loading) {
    return <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>;
  }
  
  if (!hasRole('sales_manager') && !hasRole('admin')) {
    redirect('/dashboard');
    return null;
  }
  
  // Get selected team data
  const selectedTeamData = teams.find(team => team.id === selectedTeam);
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-gray-600">Manage your sales teams and team members</p>
        </div>
        
        <Button 
          onClick={() => setIsAddTeamOpen(true)} 
          className="mt-4 md:mt-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Team
        </Button>
      </div>
      
      {isLoading && teams.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <Card key={i} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-10" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-10" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-6 w-10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Team Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <AnimatePresence>
              {teams.map(team => (
                <motion.div 
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className={`relative overflow-hidden cursor-pointer transition-all ${
                      selectedTeam === team.id 
                        ? 'ring-2 ring-blue-500 shadow-lg' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedTeam(team.id)}
                  >
                    <div 
                      className={`absolute top-0 left-0 w-1 h-full ${
                        selectedTeam === team.id ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    ></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{team.name}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                // Edit team functionality
                                // setEditingTeam(team);
                                // setIsEditTeamOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Team
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setTeamToDelete(team.id);
                                setShowDeleteConfirm(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription>{team.description || 'No description provided'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Members</p>
                          <p className="font-semibold">{team.memberCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Leads</p>
                          <p className="font-semibold">{team.leadCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Conversion</p>
                          <div className="flex items-center">
                            <p className="font-semibold">{team.conversionRate}%</p>
                            {parseFloat(team.conversionRate) > 30 && (
                              <Sparkles className="h-3 w-3 ml-1 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 text-xs text-gray-500">
                      Created: {team.createdAt?.toDate().toLocaleDateString() || 'Unknown'}
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Selected Team Details */}
          {selectedTeamData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">{selectedTeamData.name}</CardTitle>
                      <CardDescription>
                        {selectedTeamData.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddMemberOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Member
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="overview" onValueChange={setCurrentTab} value={currentTab}>
                    <TabsList className="mb-6">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="members">Team Members</TabsTrigger>
                      <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                      <TabsTrigger value="leads">Lead Distribution</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview">
                      <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-gray-500">Team Members</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center">
                                <Users className="h-8 w-8 text-blue-500 mr-3" />
                                <div>
                                  <p className="text-2xl font-bold">{teamStats.totalMembers || 0}</p>
                                  <p className="text-xs text-gray-500">Active telemarketers</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-gray-500">Total Leads</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center">
                                <User className="h-8 w-8 text-purple-500 mr-3" />
                                <div>
                                  <p className="text-2xl font-bold">{teamStats.totalLeads || 0}</p>
                                  <p className="text-xs text-gray-500">Assigned to team</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-gray-500">Converted Leads</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center">
                                <Trophy className="h-8 w-8 text-green-500 mr-3" />
                                <div>
                                  <p className="text-2xl font-bold">{teamStats.convertedLeads || 0}</p>
                                  <p className="text-xs text-gray-500">Successfully qualified</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-gray-500">Conversion Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center">
                                <Award className="h-8 w-8 text-amber-500 mr-3" />
                                <div>
                                  <p className="text-2xl font-bold">{teamStats.conversionRate || 0}%</p>
                                  <p className="text-xs text-gray-500">Overall performance</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        {/* Lead Status Distribution */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Lead Status Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {teamStats.leadsByStatus?.map((status: any, index: number) => (
                                  <div key={index}>
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="flex items-center">
                                        <div 
                                          className="w-3 h-3 rounded-full mr-2" 
                                          style={{ backgroundColor: status.color }}
                                        ></div>
                                        <span className="text-sm">{status.status}</span>
                                      </div>
                                      <span className="text-sm font-medium">{status.count}</span>
                                    </div>
                                    <Progress 
                                      value={(status.count / teamStats.totalLeads) * 100} 
                                      className="h-2"
                                      style={{ 
                                        backgroundColor: `${status.color}20`, // 20% opacity
                                        '--tw-progress-fill': status.color 
                                      } as React.CSSProperties}
                                    />
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                          
                          {/* Top Performer Card */}
                          {teamStats.topPerformer && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Top Performer</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center mb-4">
                                  <Avatar className="h-16 w-16 mr-4">
                                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                                      {teamStats.topPerformer.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-semibold text-lg flex items-center">
                                      {teamStats.topPerformer.name}
                                      <Star className="h-4 w-4 ml-2 text-yellow-500 fill-yellow-500" />
                                    </h3>
                                    <p className="text-sm text-gray-500">{teamStats.topPerformer.email}</p>
                                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">
                                      Top Converter
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div>
                                    <p className="text-xs text-gray-500">Leads</p>
                                    <p className="font-semibold">{teamStats.topPerformer.leadCount || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Converted</p>
                                    <p className="font-semibold">{teamStats.topPerformer.leadsQualified || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Rate</p>
                                    <p className="font-semibold">{teamStats.topPerformer.conversionRate}%</p></div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                        
                        {/* Recent Activity Accordion */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Recent Team Activity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Accordion type="single" collapsible defaultValue="item-0">
                              {teamStats.recentActivity?.map((activity: any, index: number) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                  <AccordionTrigger className="hover:no-underline">
                                    <div className="flex justify-between items-center w-full pr-4">
                                      <div className="flex items-center">
                                        {activity.type === 'lead_added' && (
                                          <User className="h-4 w-4 mr-2 text-blue-500" />
                                        )}
                                        {activity.type === 'lead_converted' && (
                                          <Trophy className="h-4 w-4 mr-2 text-green-500" />
                                        )}
                                        {activity.type === 'follow_up_completed' && (
                                          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                                            Follow-up
                                          </Badge>
                                        )}
                                        {activity.type === 'new_member_added' && (
                                          <Users className="h-4 w-4 mr-2 text-orange-500" />
                                        )}
                                        <span className="ml-2">
                                          {activity.type.split('_').map((word: string) => 
                                            word.charAt(0).toUpperCase() + word.slice(1)
                                          ).join(' ')}
                                        </span>
                                      </div>
                                      <div className="flex items-center">
                                        <Badge variant="outline">{activity.time}</Badge>
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="pl-6 border-l-2 border-gray-100">
                                      {activity.type === 'lead_added' && (
                                        <p className="text-sm text-gray-600">
                                          {activity.count} new leads were added to the team. These leads are now 
                                          ready for processing by team members.
                                        </p>
                                      )}
                                      {activity.type === 'lead_converted' && (
                                        <p className="text-sm text-gray-600">
                                          {activity.count} leads were successfully converted. These leads have been 
                                          assigned to counselors for further processing.
                                        </p>
                                      )}
                                      {activity.type === 'follow_up_completed' && (
                                        <p className="text-sm text-gray-600">
                                          {activity.count} follow-ups were completed by team members. 
                                          3 leads moved to qualified status, 2 were marked as not interested.
                                        </p>
                                      )}
                                      {activity.type === 'new_member_added' && (
                                        <p className="text-sm text-gray-600">
                                          {activity.count} new team member was added to the team. 
                                          New training sessions have been scheduled.
                                        </p>
                                      )}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="members">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Team Members</h3>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setIsAddMemberOpen(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Member
                          </Button>
                        </div>
                        
                        {isLoading ? (
                          <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                              <Card key={i}>
                                <CardContent className="p-4">
                                  <div className="flex items-center">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="ml-4 space-y-2">
                                      <Skeleton className="h-4 w-36" />
                                      <Skeleton className="h-3 w-24" />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div>
                            {teamMembers.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[250px]">
                                      <Button 
                                        variant="ghost" 
                                        onClick={() => requestSort('name')}
                                        className="px-0 font-medium flex items-center"
                                      >
                                        Name
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                      </Button>
                                    </TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">
                                      <Button 
                                        variant="ghost" 
                                        onClick={() => requestSort('leadCount')}
                                        className="px-0 font-medium flex items-center"
                                      >
                                        Assigned Leads
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                      </Button>
                                    </TableHead>
                                    <TableHead className="text-right">In Progress</TableHead>
                                    <TableHead className="text-right">
                                      <Button 
                                        variant="ghost" 
                                        onClick={() => requestSort('leadsQualified')}
                                        className="px-0 font-medium flex items-center"
                                      >
                                        Qualified
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                      </Button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                      <Button 
                                        variant="ghost" 
                                        onClick={() => requestSort('conversionRate')}
                                        className="px-0 font-medium flex items-center"
                                      >
                                        Conv. Rate
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                      </Button>
                                    </TableHead>
                                    <TableHead>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <AnimatePresence>
                                    {teamMembers.map((member) => (
                                      <motion.tr
                                        key={member.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={`cursor-pointer ${
                                          selectedMember?.id === member.id
                                            ? "bg-blue-50"
                                            : undefined
                                        }`}
                                        onClick={() => setSelectedMember(member)}
                                      >
                                        <TableCell>
                                          <div className="flex items-center">
                                            <Avatar className="h-8 w-8 mr-3">
                                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                                {member.name.charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <div className="font-medium">{member.name}</div>
                                              <div className="text-sm text-gray-500">{member.email}</div>
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline">
                                            {member.role === 'telemarketer' ? 'Telemarketer' : member.role}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{member.leadCount || 0}</TableCell>
                                        <TableCell className="text-right">{member.leadsInProgress || 0}</TableCell>
                                        <TableCell className="text-right">{member.leadsQualified || 0}</TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex items-center justify-end">
                                            <span className="font-medium">{member.conversionRate}%</span>
                                            {parseFloat(member.conversionRate) > 50 && (
                                              <Star className="h-3 w-3 ml-1 fill-yellow-500 text-yellow-500" />
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <ChevronDown className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                              <DropdownMenuItem>
                                                <User className="mr-2 h-4 w-4" />
                                                View Profile
                                              </DropdownMenuItem>
                                              <DropdownMenuItem>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Member
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem>
                                                <Trophy className="mr-2 h-4 w-4" />
                                                View Performance
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem className="text-red-600">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remove Member
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </TableCell>
                                      </motion.tr>
                                    ))}
                                  </AnimatePresence>
                                </TableBody>
                              </Table>
                            ) : (
                              <Card>
                                <CardContent className="flex flex-col items-center justify-center p-6">
                                  <Users className="h-12 w-12 text-gray-300 mb-4" />
                                  <h3 className="text-lg font-medium mb-1">No Team Members</h3>
                                  <p className="text-gray-500 text-center mb-4">
                                    This team does not have any members yet.
                                  </p>
                                  <Button 
                                    onClick={() => setIsAddMemberOpen(true)} 
                                    size="sm"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add First Member
                                  </Button>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        )}
                        
                        {/* Selected Member Details */}
                        {selectedMember && (
                          <Card className="mt-6">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-base">Member Details</CardTitle>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => setSelectedMember(null)}
                                >
                                  <span className="sr-only">Close</span>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-col md:flex-row md:space-x-6">
                                <div className="flex flex-col items-center mb-4 md:mb-0">
                                  <Avatar className="h-20 w-20 mb-2">
                                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                                      {selectedMember.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <h3 className="font-medium">{selectedMember.name}</h3>
                                  <p className="text-sm text-gray-500">{selectedMember.email}</p>
                                  <div className="mt-2">
                                    <Badge className="mr-2">{selectedMember.role}</Badge>
                                    {parseFloat(selectedMember.conversionRate) > 50 && (
                                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                        Top Performer
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex-1">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                      <CardHeader className="py-3">
                                        <CardTitle className="text-sm">Lead Statistics</CardTitle>
                                      </CardHeader>
                                      <CardContent className="py-0">
                                        <dl className="divide-y divide-gray-100">
                                          <div className="flex justify-between py-2">
                                            <dt className="text-sm text-gray-500">Assigned Leads</dt>
                                            <dd className="text-sm font-medium">{selectedMember.leadCount || 0}</dd>
                                          </div>
                                          <div className="flex justify-between py-2">
                                            <dt className="text-sm text-gray-500">In Progress</dt>
                                            <dd className="text-sm font-medium">{selectedMember.leadsInProgress || 0}</dd>
                                          </div>
                                          <div className="flex justify-between py-2">
                                            <dt className="text-sm text-gray-500">Qualified</dt>
                                            <dd className="text-sm font-medium">{selectedMember.leadsQualified || 0}</dd>
                                          </div>
                                          <div className="flex justify-between py-2">
                                            <dt className="text-sm text-gray-500">Not Interested</dt>
                                            <dd className="text-sm font-medium">{selectedMember.leadsNotInterested || 0}</dd>
                                          </div>
                                          <div className="flex justify-between py-2">
                                            <dt className="text-sm text-gray-500">Conversion Rate</dt>
                                            <dd className="text-sm font-medium">{selectedMember.conversionRate}%</dd>
                                          </div>
                                        </dl>
                                      </CardContent>
                                    </Card>
                                    
                                    <Card>
                                      <CardHeader className="py-3">
                                        <CardTitle className="text-sm">Quick Actions</CardTitle>
                                      </CardHeader>
                                      <CardContent className="py-0 space-y-2">
                                        <Button size="sm" variant="outline" className="w-full justify-start">
                                          <Trophy className="mr-2 h-4 w-4" />
                                          View Performance
                                        </Button>
                                        <Button size="sm" variant="outline" className="w-full justify-start">
                                          <User className="mr-2 h-4 w-4" />
                                          Assign Leads
                                        </Button>
                                        <Button size="sm" variant="outline" className="w-full justify-start">
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit Profile
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  </div>
                                  
                                  <div className="mt-4">
                                    <Card>
                                      <CardHeader className="py-3">
                                        <CardTitle className="text-sm">Activity Timeline</CardTitle>
                                      </CardHeader>
                                      <CardContent className="py-0">
                                        <div className="relative ml-3 pb-1">
                                          <div className="absolute top-0 bottom-0 left-[7px] w-[2px] bg-gray-100"></div>
                                          <ul className="space-y-3">
                                            <li className="relative flex gap-x-4">
                                              <div className="relative h-[14px] w-[14px] flex items-center justify-center">
                                                <div className="h-[9px] w-[9px] rounded-full bg-blue-600 ring-[2.5px] ring-white"></div>
                                              </div>
                                              <div className="flex-1 py-0.5">
                                                <p className="text-xs leading-5 text-gray-500">
                                                  <span className="font-medium text-gray-900">Lead qualified</span> · 2 hours ago
                                                </p>
                                              </div>
                                            </li>
                                            <li className="relative flex gap-x-4">
                                              <div className="relative h-[14px] w-[14px] flex items-center justify-center">
                                                <div className="h-[9px] w-[9px] rounded-full bg-green-600 ring-[2.5px] ring-white"></div>
                                              </div>
                                              <div className="flex-1 py-0.5">
                                                <p className="text-xs leading-5 text-gray-500">
                                                  <span className="font-medium text-gray-900">Follow-up completed</span> · Yesterday
                                                </p>
                                              </div>
                                            </li>
                                            <li className="relative flex gap-x-4">
                                              <div className="relative h-[14px] w-[14px] flex items-center justify-center">
                                                <div className="h-[9px] w-[9px] rounded-full bg-purple-600 ring-[2.5px] ring-white"></div>
                                              </div>
                                              <div className="flex-1 py-0.5">
                                                <p className="text-xs leading-5 text-gray-500">
                                                  <span className="font-medium text-gray-900">5 leads assigned</span> · 2 days ago
                                                </p>
                                              </div>
                                            </li>
                                          </ul>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="activity">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Team Activity Log</h3>
                          <Button size="sm" variant="outline">
                            Export Data
                          </Button>
                        </div>
                        
                        <Card>
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Activity</TableHead>
                                  <TableHead>Team Member</TableHead>
                                  <TableHead className="text-right">Timestamp</TableHead>
                                  <TableHead className="text-right">Details</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {/* Mock activity data - would be real data in production */}
                                <TableRow>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-50">
                                      Lead Added
                                    </Badge>
                                  </TableCell>
                                  <TableCell>System</TableCell>
                                  <TableCell className="text-right">2 hours ago</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">View</Button>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-50">
                                      Lead Qualified
                                    </Badge>
                                  </TableCell>
                                  <TableCell>John Smith</TableCell>
                                  <TableCell className="text-right">4 hours ago</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">View</Button>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-purple-50 text-purple-800 hover:bg-purple-50">
                                      Follow-up
                                    </Badge>
                                  </TableCell>
                                  <TableCell>Sarah Johnson</TableCell>
                                  <TableCell className="text-right">Yesterday</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">View</Button>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">
                                      Member Added
                                    </Badge>
                                  </TableCell>
                                  <TableCell>Admin</TableCell>
                                  <TableCell className="text-right">2 days ago</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">View</Button>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="leads">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Lead Distribution</h3>
                          <div className="flex space-x-2">
                            <Select defaultValue="last7days">
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select time period" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="last7days">Last 7 Days</SelectItem>
                                <SelectItem value="last30days">Last 30 Days</SelectItem>
                                <SelectItem value="alltime">All Time</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm">
                              Export
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Lead Distribution by Member</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {teamMembers.slice(0, 5).map((member) => (
                                  <div key={member.id}>
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="flex items-center">
                                        <Avatar className="h-6 w-6 mr-2">
                                          <AvatarFallback className="text-xs">
                                            {member.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{member.name}</span>
                                      </div>
                                      <span className="text-sm font-medium">{member.leadCount || 0}</span>
                                    </div>
                                    <Progress 
                                      value={member.leadCount} 
                                      max={Math.max(...teamMembers.map(m => m.leadCount || 0), 1)}
                                      className="h-2"
                                    />
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Lead Sources</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {/* Mock lead source data */}
                                {[
                                  { source: 'Website', count: 42, color: '#3B82F6' },
                                  { source: 'Referral', count: 28, color: '#10B981' },
                                  { source: 'Social Media', count: 18, color: '#8B5CF6' },
                                  { source: 'Event', count: 8, color: '#F59E0B' },
                                  { source: 'Other', count: 4, color: '#6B7280' },
                                ].map((source, index) => (
                                  <div key={index}>
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="flex items-center">
                                        <div 
                                          className="w-3 h-3 rounded-full mr-2" 
                                          style={{ backgroundColor: source.color }}
                                        ></div>
                                        <span className="text-sm">{source.source}</span>
                                      </div>
                                      <span className="text-sm font-medium">{source.count}</span>
                                    </div>
                                    <Progress 
                                      value={source.count} 
                                      max={100}
                                      className="h-2"
                                      style={{ 
                                        backgroundColor: `${source.color}20`, // 20% opacity
                                        '--tw-progress-fill': source.color 
                                      } as React.CSSProperties}
                                    />
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Lead Distribution Rules</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Current Distribution Method</h4>
                                <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                                  Round Robin
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  Leads are distributed evenly among team members
                                </span>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Daily Lead Cap</h4>
                                {selectedTeamData.leadCapEnabled ? (
                                  <div className="flex items-center">
                                    <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-50">
                                      Enabled
                                    </Badge>
                                    <span className="ml-2 text-sm text-gray-500">
                                      Maximum {selectedTeamData.leadCapCount || 20} leads per day per member
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                                      Disabled
                                    </Badge>
                                    <span className="ml-2 text-sm text-gray-500">
                                      No limit on daily lead assignments
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <Button size="sm" variant="outline">
                                  Modify Distribution Rules
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
      
      {/* Add Team Dialog */}
      <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Add a new team to your sales management structure
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateTeam}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  placeholder="Enter team name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter team description"
                  value={newTeam.description}
                 onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddTeamOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Team</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to {selectedTeamData?.name || 'your team'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddMember}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="memberName">Name</Label>
                <Input
                  id="memberName"
                  placeholder="Enter member name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="memberEmail">Email</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  placeholder="Enter member email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="memberRole">Role</Label>
                <Select 
                  value={newMember.role}
                  onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telemarketer">Telemarketer</SelectItem>
                    <SelectItem value="team_lead">Team Lead</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Team Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center p-3 border border-red-100 bg-red-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-sm text-red-600">
              Deleting this team will remove all members and data associated with it.
            </p>
          </div>
          
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTeam}
            >
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
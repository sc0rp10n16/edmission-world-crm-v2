'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC } from '@/hooks/auth/useRBAC';
import LoadingSpinner from '@/components/LoadingSpinner';
import { redirect } from 'next/navigation';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  UserPlus, 
  ChevronDown, 
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  FilePenLine
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '@/firebase';
import { getUsersByRole, updateUser } from '@/lib/firebase/models/user';
import { User, UserRole } from '@/lib/types/user';


// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';

// Interfaces
interface Manager extends User {
  teamSize?: number;
  leadCount?: number;
  conversionRate?: number;
}

interface Team {
  id: string;
  name: string;
  managerId: string;
  managerName: string;
  memberCount: number;
  region: string;
  program: string;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

// Telemarketer Selector Component
const TelemarketerSelector = ({
  telemarketers,
  selectedIds,
  onChange
}: {
  telemarketers: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filteredTelemarketers = telemarketers.filter(
    t => t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         t.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div>
      <Label>Team Members</Label>
      <div className="mt-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
            >
              {selectedIds.length > 0 
                ? `${selectedIds.length} telemarketers selected` 
                : "Select team members"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <div className="border-b px-3 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search telemarketers..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="h-60">
              {filteredTelemarketers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No telemarketers found.
                </div>
              ) : (
                <div className="p-1">
                  {filteredTelemarketers.map((telemarketer) => (
                    <div
                      key={telemarketer.uid}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={() => handleToggle(telemarketer.uid)}
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <Checkbox 
                          checked={selectedIds.includes(telemarketer.uid)} 
                          onCheckedChange={() => handleToggle(telemarketer.uid)}
                        />
                        <span>{telemarketer.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="p-2 bg-muted/50 border-t flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {selectedIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedIds.map(id => {
              const telemarketer = telemarketers.find(t => t.uid === id);
              return (
                <Badge key={id} variant="secondary" className="mr-1 mb-1">
                  {telemarketer?.name}
                  <button 
                    className="ml-1 text-xs opacity-70 hover:opacity-100"
                    onClick={() => handleToggle(id)}
                    type="button"
                  >
                    ×
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Create Team Form
const CreateTeamForm = ({ onClose, onSuccess, telemarketers }: { 
  onClose: () => void, 
  onSuccess: () => void,
  telemarketers: User[] 
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    managerId: '',
    region: '',
    program: '',
  });
  const [selectedTelemarketers, setSelectedTelemarketers] = useState<string[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingManagers, setFetchingManagers] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch managers from the User collection using role=sales_manager
    const fetchManagers = async () => {
      try {
        setFetchingManagers(true);
        // Use the getUsersByRole function from your user model
        const managersData = await getUsersByRole('sales_manager');
        setManagers(managersData as Manager[]);
      } catch (err) {
        console.error('Error fetching managers:', err);
        toast({
          title: "Error",
          description: "Failed to fetch managers. Please try again.",
          variant: "destructive",
        });
      } finally {
        setFetchingManagers(false);
      }
    };

    fetchManagers();
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get the selected manager details
      const selectedManager = managers.find(m => m.uid === formData.managerId);
      if (!selectedManager) {
        throw new Error('Selected manager not found');
      }

      // Create a new team in Firestore
      const teamData = {
        name: formData.name,
        managerId: formData.managerId,
        managerName: selectedManager.name,
        memberCount: selectedTelemarketers.length,
        region: formData.region,
        program: formData.program,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const teamsRef = collection(db, 'teams');
      const teamDocRef = await addDoc(teamsRef, teamData);
      const teamId = teamDocRef.id;
      
      // Assign team to selected telemarketers
      for (const telemarketerId of selectedTelemarketers) {
        await updateUser(telemarketerId, { teamId });
      }
      
      toast({
        title: "Team created",
        description: `${formData.name} has been created with ${selectedTelemarketers.length} telemarketers.`,
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating team:', err);
      setError('Failed to create team. Please try again.');
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Team Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="managerId">Manager</Label>
          <select 
            id="managerId"
            name="managerId"
            value={formData.managerId}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="">Select a manager</option>
            {managers.map(manager => (
              <option key={manager.uid} value={manager.uid}>
                {manager.name} - {manager.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            name="region"
            value={formData.region}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="program">Program</Label>
          <Input
            id="program"
            name="program"
            value={formData.program}
            onChange={handleChange}
            required
          />
        </div>
        
        <TelemarketerSelector
          telemarketers={telemarketers}
          selectedIds={selectedTelemarketers}
          onChange={setSelectedTelemarketers}
        />
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
      </div>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : 'Create Team'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// Edit Team Dialog
const EditTeamDialog = ({ 
  team, 
  managers, 
  telemarketers, 
  onClose, 
  onSave 
}: { 
  team: Team; 
  managers: Manager[]; 
  telemarketers: User[]; 
  onClose: () => void; 
  onSave: () => void; 
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: team.name,
    managerId: team.managerId,
    region: team.region,
    program: team.program,
    status: team.status
  });
  const [selectedTelemarketers, setSelectedTelemarketers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch current team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const teamMembers = telemarketers.filter(t => t.teamId === team.id).map(t => t.uid);
        setSelectedTelemarketers(teamMembers);
      } catch (err) {
        console.error('Error fetching team members:', err);
      }
    };
    
    fetchTeamMembers();
  }, [team.id, telemarketers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleStatusChange = (value: string) => {
    setFormData({
      ...formData,
      status: value as 'active' | 'inactive'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get the selected manager details
      const selectedManager = managers.find(m => m.uid === formData.managerId);
      if (!selectedManager) {
        throw new Error('Selected manager not found');
      }

      // Update team in Firestore
      const teamRef = doc(db, 'teams', team.id);
      await updateDoc(teamRef, {
        name: formData.name,
        managerId: formData.managerId,
        managerName: selectedManager.name,
        memberCount: selectedTelemarketers.length,
        region: formData.region,
        program: formData.program,
        status: formData.status,
        updatedAt: serverTimestamp()
      });
      
      // Get current team members
      const currentTeamMembers = telemarketers
        .filter(t => t.teamId === team.id)
        .map(t => t.uid);
      
      // Determine which telemarketers to add and remove
      const telemarketerToAdd = selectedTelemarketers.filter(id => !currentTeamMembers.includes(id));
      const telemarketerToRemove = currentTeamMembers.filter(id => !selectedTelemarketers.includes(id));
      
      // Assign new telemarketers to this team
      for (const telemarketerId of telemarketerToAdd) {
        await updateUser(telemarketerId, { teamId: team.id });
      }
      
      // Remove telemarketers from team
      for (const telemarketerId of telemarketerToRemove) {
        await updateUser(telemarketerId, { teamId: undefined });
      }
      
      toast({
        title: "Team updated",
        description: `${formData.name} has been updated successfully.`,
      });
      
      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating team:', err);
      setError('Failed to update team. Please try again.');
      toast({
        title: "Error",
        description: "Failed to update team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Team Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="managerId">Manager</Label>
          <select 
            id="managerId"
            name="managerId"
            value={formData.managerId}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            {managers.map(manager => (
              <option key={manager.uid} value={manager.uid}>
                {manager.name} - {manager.email}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="program">Program</Label>
            <Input
              id="program"
              name="program"
              value={formData.program}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select team status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <TelemarketerSelector
          telemarketers={telemarketers}
          selectedIds={selectedTelemarketers}
          onChange={setSelectedTelemarketers}
        />
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
      </div>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// View Team Members Dialog
const ViewTeamMembersDialog = ({ 
  team, 
  teamMembers, 
  onClose 
}: { 
  team: Team; 
  teamMembers: User[]; 
  onClose: () => void; 
}) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Team Members</DialogTitle>
        <DialogDescription>
          {team.name} - Total: {teamMembers.length} members
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No team members found.
          </div>
        ) : (
          <ScrollArea className="h-60">
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.uid} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/admin/users/${member.uid}`}>
                      <FilePenLine className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </>
  );
};

// Main component
export default function TeamsManagementPage() {
  const { user, loading, hasRole } = useRBAC();
  const { toast } = useToast();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [telemarketers, setTelemarketers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('teams');
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [isViewMembersOpen, setIsViewMembersOpen] = useState(false);

  useEffect(() => {
    if (!loading && !hasRole('admin')) {
      redirect('/dashboard');
    }
  }, [loading, hasRole]);

  // Separate useEffect for data fetching to avoid infinite loops
  useEffect(() => {
    // Fetch data from Firebase
    const fetchData = async () => {
      try {
        setLoadingData(true);
        
        // Fetch managers (sales_manager role users)
        const managersData = await getUsersByRole('sales_manager');
        
        // Fetch telemarketers
        const telemarketerData = await getUsersByRole('telemarketer');
        
        // Fetch teams
        const teamsRef = collection(db, 'teams');
        const teamsQuery = query(teamsRef, orderBy('name'));
        const teamsSnapshot = await getDocs(teamsQuery);
        
        const teamsData: Team[] = [];
        teamsSnapshot.forEach((doc) => {
          teamsData.push({ id: doc.id, ...doc.data() } as Team);
        });
        
        // Count team members for each team
        const teamMemberCounts = new Map<string, number>();
        
        for (const telemarketer of telemarketerData) {
          if (telemarketer.teamId) {
            const count = teamMemberCounts.get(telemarketer.teamId) || 0;
            teamMemberCounts.set(telemarketer.teamId, count + 1);
          }
        }
        
        // Update team member counts
        const updatedTeams = teamsData.map(team => ({
          ...team,
          memberCount: teamMemberCounts.get(team.id) || 0
        }));
        
        // Calculate team counts for managers
        const managerTeamCounts = new Map<string, number>();
        
        for (const team of teamsData) {
          const count = managerTeamCounts.get(team.managerId) || 0;
          managerTeamCounts.set(team.managerId, count + 1);
        }
        
        // Add team counts to managers
        const managersWithTeamCounts = managersData.map(manager => ({
          ...manager,
          teamSize: managerTeamCounts.get(manager.uid) || 0
        }));
        
        setManagers(managersWithTeamCounts as Manager[]);
        setTelemarketers(telemarketerData);
        setTeams(updatedTeams);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch team data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (!loading && user) {
      fetchData();
    }
  }, [loading, user, toast]);

  const handleRefresh = async () => {
    setLoadingData(true);
    
    try {
      // Fetch managers (sales_manager role users)
      const managersData = await getUsersByRole('sales_manager');
      
      // Fetch telemarketers
      const telemarketerData = await getUsersByRole('telemarketer');
      
      // Fetch teams
      const teamsRef = collection(db, 'teams');
      const teamsQuery = query(teamsRef, orderBy('name'));
      const teamsSnapshot = await getDocs(teamsQuery);
      
      const teamsData: Team[] = [];
      teamsSnapshot.forEach((doc) => {
        teamsData.push({ id: doc.id, ...doc.data() } as Team);
      });
      
      // Count team members for each team
      const teamMemberCounts = new Map<string, number>();
      
      for (const telemarketer of telemarketerData) {
        if (telemarketer.teamId) {
          const count = teamMemberCounts.get(telemarketer.teamId) || 0;
          teamMemberCounts.set(telemarketer.teamId, count + 1);
        }
      }
      
      // Update team member counts
      const updatedTeams = teamsData.map(team => ({
        ...team,
        memberCount: teamMemberCounts.get(team.id) || 0
      }));
      
      // Calculate team counts for managers
      const managerTeamCounts = new Map<string, number>();
      
      for (const team of teamsData) {
        const count = managerTeamCounts.get(team.managerId) || 0;
        managerTeamCounts.set(team.managerId, count + 1);
      }
      
      // Add team counts to managers
      const managersWithTeamCounts = managersData.map(manager => ({
        ...manager,
        teamSize: managerTeamCounts.get(manager.uid) || 0
      }));
      
      setManagers(managersWithTeamCounts as Manager[]);
      setTelemarketers(telemarketerData);
      setTeams(updatedTeams);
      
      toast({
        title: "Data refreshed",
        description: "The latest team and user data has been loaded.",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const openDeleteConfirm = (id: string) => {
    setTeamToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (teamToDelete) {
        // Get the team details
        const team = teams.find(t => t.id === teamToDelete);
        if (!team) {
          throw new Error('Team not found');
        }
        
        // Delete the team
        const teamRef = doc(db, 'teams', teamToDelete);
        await deleteDoc(teamRef);
        
        // Reset the teamId for all telemarketers in this team
        const teamTelemarketers = telemarketers.filter(t => t.teamId === teamToDelete);
        for (const telemarketer of teamTelemarketers) {
          await updateUser(telemarketer.uid, { teamId: undefined });
        }
        
        // Update state
        setTeams(teams.filter(team => team.id !== teamToDelete));
        
        toast({
          title: "Team deleted",
          description: "The team has been successfully deleted and members have been unassigned.",
        });
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setTeamToDelete(null);
    }
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsEditTeamOpen(true);
  };

  const handleViewMembers = (team: Team) => {
    setSelectedTeam(team);
    setIsViewMembersOpen(true);
  };

  const getTeamMembers = (teamId: string) => {
    return telemarketers.filter(t => t.teamId === teamId);
  };

  const filteredManagers = managers.filter(manager => 
    manager.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    manager.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>;
  }

  if (!user) {
    redirect('/login');
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Teams & Managers</h1>
          <p className="text-gray-500">Manage sales teams and their managers</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Create a new sales team, assign a manager and add team members.
                </DialogDescription>
              </DialogHeader>
              <CreateTeamForm 
                onClose={() => setIsCreateTeamOpen(false)} 
                onSuccess={handleRefresh}
                telemarketers={telemarketers}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, region or program..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="managers">Managers</TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Sales Teams</CardTitle>
              <CardDescription>
                Manage all sales teams in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No teams found matching your search criteria
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.managerName}</TableCell>
                        <TableCell>{team.region}</TableCell>
                        <TableCell>{team.program}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <button className="hover:underline focus:outline-none" onClick={() => handleViewMembers(team)}>
                                  {team.memberCount}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Click to view team members
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {team.status === 'active' ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                Active
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                                Inactive
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewMembers(team)}>
                                View Members
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditTeam(team)}>
                                Edit Team
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => openDeleteConfirm(team.id)}
                              >
                                Delete Team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="managers">
          <Card>
            <CardHeader>
              <CardTitle>Sales Team Managers</CardTitle>
              <CardDescription>
                View all sales team managers in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredManagers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No managers found matching your search criteria
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Team Count</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredManagers.map((manager) => (
                      <TableRow key={manager.uid}>
                        <TableCell className="font-medium">{manager.name}</TableCell>
                        <TableCell>{manager.email}</TableCell>
                        <TableCell>{manager.teamSize || 0}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`/admin/users/${manager.uid}`}>
                              <Edit className="h-4 w-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this team? This will remove the team and unassign all team members.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Team Dialog */}
      {selectedTeam && (
        <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>
                Update team details and manage team members
              </DialogDescription>
            </DialogHeader>
            <EditTeamDialog 
              team={selectedTeam}
              managers={managers}
              telemarketers={telemarketers}
              onClose={() => setIsEditTeamOpen(false)}
              onSave={handleRefresh}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Team Members Dialog */}
      {selectedTeam && (
        <Dialog open={isViewMembersOpen} onOpenChange={setIsViewMembersOpen}>
          <DialogContent>
            <ViewTeamMembersDialog 
              team={selectedTeam}
              teamMembers={getTeamMembers(selectedTeam.id)}
              onClose={() => setIsViewMembersOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
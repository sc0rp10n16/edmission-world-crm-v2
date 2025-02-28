// Import with proper types
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
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

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
  updatedAt?: any;}

// Example of the corrected telemarketer selection implementation
export const TelemarketerSelector = ({
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

// Updated Create Team Form with the new selector component
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

// Similar approach for the EditTeamDialog (replace the Command component with our custom TelemarketerSelector)
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
// components/leads/LeadManagementContent.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  runTransaction, 
  doc, 
  updateDoc, 
  arrayUnion, 
  setDoc, 
  increment,

} from 'firebase/firestore';
import { db } from '@/firebase';
import { parse } from 'papaparse';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Upload,
  Plus,
  Users,
  UserPlus,
  FileText,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Database,
  ListFilter,
  BarChart,
  Calendar,
  User,
  Mail,
  Phone,
  Edit
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import LoadingSpinner from '@/components/LoadingSpinner';

// Custom components for Lead Management
import ImportStatsCard from '@/components/leads/ImportStatsCard';

// Define the Lead interface
interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: Date;
  createdBy?: string;
  teamId: string;
  assignedTo?: string;
  source?: string;
  notes?: string;
  interestedCountry?: string;
  course?: string;
}

export default function LeadManagementContent() {
  const [activeTab, setActiveTab] = useState('upload');
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [distributionMethod, setDistributionMethod] = useState('round-robin');
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [leadImportStats, setLeadImportStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    lastImport: null as Date | null
  });
  
  // Animation state
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  // Form state for manual lead entry
  const [manualLead, setManualLead] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    notes: '',
    interestedCountry: '',
    course: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  // Required field mapping
  const requiredFields = ['name', 'email', 'phone'];
  const possibleFieldMappings = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'source', label: 'Source' },
    { value: 'interestedCountry', label: 'interestedCountry' },
    { value: 'course', label: 'course' },
    { value: 'notes', label: 'Notes' },
    { value: 'address', label: 'Address' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'zip', label: 'Zip Code' },
    { value: 'country', label: 'Country' },
    { value: 'skip', label: '-- Skip this field --' },
  ];
  
  // Database test function
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      
      // Try to write a test document
      try {
        const testCollection = collection(db, 'connection_test');
        const docRef = await addDoc(testCollection, {
          timestamp: new Date(),
          test: 'Database connection test'
        });
        console.log('Write operation successful! Document ID:', docRef.id);
        toast.success('Database connection successful');
      } catch (writeError) {
        console.error('Write operation failed:', writeError);
        toast.error('Database write failed: ' + (writeError instanceof Error ? writeError.message : 'Unknown error'));
      }
    } catch (error) {
      console.error('Database connection test failed:', error);
      toast.error('Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
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
        }));
        
        setTeams(teamsData);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeams();
  }, [user]);
  
  // Fetch recent leads
  useEffect(() => {
    const fetchRecentLeads = async () => {
      try {
        // This would fetch actual lead data in a real app
        // For now we'll use mock data
        const mockLeads = [
          { id: '1', name: 'John Smith', email: 'john@example.com', status: 'new', assignedTo: 'User1', source: 'Website', createdAt: new Date() },
          { id: '2', name: 'Sara Wilson', email: 'sara@example.com', status: 'inProgress', assignedTo: 'User2', source: 'Referral', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          { id: '3', name: 'Mike Johnson', email: 'mike@example.com', status: 'qualified', assignedTo: 'User1', source: 'Event', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { id: '4', name: 'Emily Davis', email: 'emily@example.com', status: 'followUp1', assignedTo: 'User3', source: 'Website', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { id: '5', name: 'Alex Brown', email: 'alex@example.com', status: 'notInterested', assignedTo: 'User2', source: 'Social Media', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        ];
        
        setRecentLeads(mockLeads);
        
        // Mock import stats
        setLeadImportStats({
          total: 187,
          successful: 182,
          failed: 5,
          lastImport: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        });
      } catch (error) {
        console.error('Error fetching recent leads:', error);
      }
    };
    
    fetchRecentLeads();
  }, []);
  
  // Fetch team members when a team is selected
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!selectedTeam) {
        setTeamMembers([]);
        return;
      }

      try {
        const usersQuery = query(
          collection(db, 'users'),
          where('teamId', '==', selectedTeam),
          where('role', '==', 'telemarketer')
        );

        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTeamMembers(usersData);
      } catch (error) {
        console.error('Error fetching team members:', error);
        toast.error('Failed to load team members');
      }
    };

    fetchTeamMembers();
  }, [selectedTeam]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    // Parse CSV for preview
    parse(file, {
      header: true,
      preview: 5,
      complete: (results) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvPreview(results.data);
        
        // Initialize field mapping with best guesses
        const initialMapping: Record<string, string> = {};
        headers.forEach(header => {
          // Try to match CSV headers with required fields
          const lowerHeader = header.toLowerCase();
          
          if (lowerHeader.includes('name')) {
            initialMapping[header] = 'name';
          } else if (lowerHeader.includes('email')) {
            initialMapping[header] = 'email';
          } else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile')) {
            initialMapping[header] = 'phone';
          } else if (lowerHeader.includes('source') || lowerHeader.includes('channel')) {
            initialMapping[header] = 'source';
          } else if (lowerHeader.includes('interestedCountry') || lowerHeader.includes('country')) {
            initialMapping[header] = 'interestedCountry';
          } else if (lowerHeader.includes('course') || lowerHeader.includes('title')) {
            initialMapping[header] = 'course';
          } else if (lowerHeader.includes('note')) {
            initialMapping[header] = 'notes';
          } else {
            initialMapping[header] = 'skip';
          }
        });
        
        setFieldMapping(initialMapping);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        toast.error('Failed to parse CSV file');
      }
    });
  };
  
  const handleMappingChange = (csvField: string, appField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvField]: appField
    }));
  };
  
  const validateMapping = () => {
    // Check if all required fields are mapped
    const mappedFields = Object.values(fieldMapping);
    return requiredFields.every(field => mappedFields.includes(field));
  };
  
  // Upload CSV file
  const handleUpload = async () => {
    if (!csvFile || !validateMapping() || !selectedTeam) {
      toast.error('Please ensure all required fields are mapped and a team is selected');
      return;
    }

    setIsProcessing(true);
    try {
      parse(csvFile, {
        header: true,
        complete: async (results) => {
          try {
            // Get telemarketers for distribution
            if (teamMembers.length === 0) {
              throw new Error('No team members available for lead assignment');
            }

            // Process and transform CSV data to match our Lead type
            const leads: Lead[] = results.data
              .filter((row: any) => {
                // Filter out empty rows
                const hasRequiredFields = requiredFields.every(field => {
                  const mappedHeader = Object.entries(fieldMapping).find(([_, val]) => val === field)?.[0];
                  return mappedHeader && row[mappedHeader] && row[mappedHeader].trim() !== '';
                });
                return hasRequiredFields;
              })
              .map((row: any) => {
                // Create a lead object that matches our Lead interface
                const lead: Lead = {
                  name: '',
                  email: '',
                  phone: '',
                  status: 'new',
                  createdAt: new Date(),
                  createdBy: user?.uid,
                  teamId: selectedTeam,
                  // Don't set assignedTo yet
                };

                // Map fields according to custom mapping
                Object.entries(fieldMapping).forEach(([csvField, appField]) => {
                  if (appField !== 'skip' && row[csvField] !== undefined) {
                    // Use type assertion to tell TypeScript this is valid
                    (lead as any)[appField] = row[csvField];
                  }
                });

                return lead;
              });

            console.log(`Processing ${leads.length} valid leads from CSV`);
            
            if (leads.length === 0) {
              throw new Error('No valid leads found in the CSV file');
            }

            // Distribute leads (either batch process or simple)
            if (leads.length > 20) {
              // Use batch processing for many leads
              await processLeadsInBatches(leads);
            } else {
              // For a smaller set, process directly
              await distributeLeads(leads);
            }
            
            // Show success animation
            setShowSuccessAnimation(true);
            setTimeout(() => setShowSuccessAnimation(false), 3000);
            
            toast.success(`Successfully uploaded and distributed ${leads.length} leads`);
            
            // Reset the form
            setCsvFile(null);
            setCsvHeaders([]);
            setCsvPreview([]);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          } catch (error) {
            console.error('Error uploading leads:', error);
            toast.error(`Failed to upload leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
          } finally {
            setIsProcessing(false);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          toast.error('Failed to parse CSV file');
          setIsProcessing(false);
        }
      });
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast.error('Failed to process CSV file');
      setIsProcessing(false);
    }
  };
  
  // Simple lead distribution
  const distributeLeads = async (leads: Lead[]) => {
    if (leads.length === 0) return;
    
    let currentMemberIndex = 0;
    const members = [...teamMembers];
    
    if (members.length === 0) {
      throw new Error('No team members available');
    }
    
    for (const lead of leads) {
      try {
        // Assign to a team member
        const assignedMember = members[currentMemberIndex];
        lead.assignedTo = assignedMember.id;
        
        // Create a new document with generated ID
        const leadsCollection = collection(db, 'leads');
        const newLeadRef = doc(leadsCollection);
        
        // Save the lead
        await setDoc(newLeadRef, {
          ...lead,
          id: newLeadRef.id
        });
        
        // Update telemarketer's lead count
        const telemarketerRef = doc(db, 'users', assignedMember.id);
        await updateDoc(telemarketerRef, {
          leadCount: increment(1),
          leadsInProgress: increment(1),
          assignedLeads: arrayUnion(newLeadRef.id)
        });
        
        // Update team's lead count
        const teamRef = doc(db, 'teams', selectedTeam);
        await updateDoc(teamRef, {
          totalLeads: increment(1)
        });
        
        // Move to next member (round-robin)
        currentMemberIndex = (currentMemberIndex + 1) % members.length;
        
        // Update UI with the new lead
        setRecentLeads(prev => [{
          ...lead,
          id: newLeadRef.id
        }, ...prev].slice(0, 10));
        
      } catch (error) {
        console.error('Error adding lead:', error);
        // Continue with next lead
      }
    }
  };
  
  // For handling larger batches of leads
  const processLeadsInBatches = async (leads: Lead[]) => {
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(leads.length/BATCH_SIZE)}`);
      await distributeLeads(batch);
    }
  };
  
  // Handle manual lead submission
  const handleManualLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeam) {
      toast.error('Please select a team for the lead');
      return;
    }

    if (!manualLead.name || !manualLead.email || !manualLead.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      // Create the lead object with the proper interface
      const lead: Lead = {
        name: manualLead.name,
        email: manualLead.email,
        phone: manualLead.phone,
        source: manualLead.source,
        notes: manualLead.notes,
        interestedCountry: manualLead.interestedCountry,
        course: manualLead.course,
        status: 'new',
        createdAt: new Date(),
        createdBy: user?.uid,
        teamId: selectedTeam,
        // Don't set assignedTo yet - we'll add it before saving
      };

      console.log('Adding new manual lead:', lead);

      // Create a direct reference to the leads collection
      const leadsCollection = collection(db, 'leads');
      
      // Create a new document with a generated ID
      const newLeadRef = doc(leadsCollection);
      
      // Check if team members exist
      if (teamMembers.length === 0) {
        toast.error('No team members available to assign lead');
        setIsProcessing(false);
        return;
      }
      
      // Select a team member to assign the lead to
      const assignedMember = teamMembers[0];
      
      // Now add the assignedTo property to the lead object
      lead.assignedTo = assignedMember.id;

      // Save the lead to Firestore
      await setDoc(newLeadRef, {
        ...lead,
        id: newLeadRef.id
      });
      
      console.log('Lead document created with ID:', newLeadRef.id);
      
      // Now update the telemarketer's lead count and the team's total
      try {
        // Update user document
        const telemarketerRef = doc(db, 'users', assignedMember.id);
        await updateDoc(telemarketerRef, {
          leadCount: increment(1),
          leadsInProgress: increment(1),
          assignedLeads: arrayUnion(newLeadRef.id)
        });
        
        console.log('Telemarketer document updated');
        
        // Update team document
        const teamRef = doc(db, 'teams', selectedTeam);
        await updateDoc(teamRef, {
          totalLeads: increment(1)
        });
        
        console.log('Team document updated');
        
      } catch (updateError) {
        console.error('Error updating related documents:', updateError);
        // Even if these updates fail, we've already created the lead
      }
      
      toast.success('Lead added successfully');
      
      // Add to recent leads list (UI update)
      const newLead = {
        ...lead,
        id: newLeadRef.id,
      };
      
      setRecentLeads(prev => [newLead, ...prev].slice(0, 10));
      
      // Reset the form
      setManualLead({
        name: '',
        email: '',
        phone: '',
        source: '',
        notes: '',
        interestedCountry: '',
        course: '',
      });
      
      // Show success animation
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);
      
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Failed to add lead: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setManualLead(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lead Management</h1>
          <p className="text-gray-600">Import, distribute, and track leads</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">Select a team</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ImportStatsCard
          total={leadImportStats.total}
          successful={leadImportStats.successful}
          failed={leadImportStats.failed}
          lastImport={leadImportStats.lastImport}
        />
        
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Team Status</CardTitle>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {selectedTeam ? `${teamMembers.length} Members` : 'No Team Selected'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTeam ? (
              <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No team selected</AlertTitle>
                <AlertDescription>
                  Please select a team to manage leads
                </AlertDescription>
              </Alert>
            ) : teamMembers.length === 0 ? (
              <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No team members</AlertTitle>
                <AlertDescription>
                  This team has no members to assign leads to
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">Distribution Method:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={distributionMethod === 'round-robin' ? 'default' : 'outline'} 
                    className="cursor-pointer"
                    onClick={() => setDistributionMethod('round-robin')}>
                    Round Robin
                  </Badge>
                  <Badge variant={distributionMethod === 'capacity-based' ? 'default' : 'outline'} 
                    className="cursor-pointer"
                    onClick={() => setDistributionMethod('capacity-based')}>
                    Capacity Based
                  </Badge>
                  <Badge variant={distributionMethod === 'manual' ? 'default' : 'outline'} 
                    className="cursor-pointer"
                    onClick={() => setDistributionMethod('manual')}>
                    Manual Assignment
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" className="justify-start">
                <Users className="mr-2 h-4 w-4" />
                View All Leads
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Export Leads
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Database className="mr-2 h-4 w-4" />
                Lead Sources
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <BarChart className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="upload" className="flex items-center">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV Upload
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="cursor-pointer">
              <RefreshCw className="mr-2 h-3 w-3" />
              Recent Imports
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              <Calendar className="mr-2 h-3 w-3" />
              Schedule Import
            </Badge>
          </div>
        </div>
        
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <TabsContent value="upload" className="mt-0 space-y-6">
              {!csvFile ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                  
                  <div className="flex flex-col items-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                    <p className="text-gray-500 mb-4 max-w-md">
                      Drag and drop a CSV file here, or click to browse your files
                    </p>
                    <Button>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Browse Files
                    </Button>
                    <p className="text-xs text-gray-400 mt-4">Supported formats: .CSV</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{csvFile.name}</h3>
                        <p className="text-sm text-gray-500">
                          {csvFile.size > 1024 * 1024
                            ? `${(csvFile.size / (1024 * 1024)).toFixed(2)} MB`
                            : `${(csvFile.size / 1024).toFixed(2)} KB`}
                          {` • ${csvHeaders.length} columns`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCsvFile(null);
                        setCsvHeaders([]);
                        setCsvPreview([]);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Clear File
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  {/* CSV Preview */}
                  {csvPreview.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">CSV Preview (first 5 rows)</h3>
                      <div className="border rounded-md overflow-hidden">
                        <ScrollArea className="h-[200px]">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-50">
                                  {csvHeaders.map((header) => (
                                    <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {csvPreview.map((row, rowIndex) => (
                                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    {csvHeaders.map((header) => (
                                      <td key={`${rowIndex}-${header}`} className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {row[header]}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  )}
                  
                  {/* Field Mapping */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Map CSV columns to lead fields</h3>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Required: Name, Email, Phone
                      </Badge>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                              CSV Column
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/3">
                              Maps to Field
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {csvHeaders.map((header) => (
                            <tr key={header} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {header}
                              </td>
                              <td className="px-4 py-3">
                                <Select
                                  value={fieldMapping[header] || 'skip'}
                                  onValueChange={(value) => handleMappingChange(header, value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {possibleFieldMappings.map((mapping) => (
                                      <SelectItem 
                                        key={mapping.value} 
                                        value={mapping.value}
                                        className={requiredFields.includes(mapping.value) ? 'font-medium' : ''}
                                      >
                                        {mapping.label} 
                                        {requiredFields.includes(mapping.value) && ' (Required)'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Upload and Distribute Button */}
                  <div className="pt-4 flex justify-end">
                    <Button 
                      size="lg"
                      onClick={handleUpload}
                      disabled={!validateMapping() || !selectedTeam || isProcessing}
                      className="relative"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Upload and Distribute Leads
                        </>
                      )}
                      
                      {/* Success animation overlay */}
                      {showSuccessAnimation && (
                        <motion.div 
                          className="absolute inset-0 flex items-center justify-center bg-green-500 text-white rounded-md"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Leads Distributed!
                        </motion.div>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="manual" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lead Entry Form */}
                <div className="lg:col-span-2">
                  <form onSubmit={handleManualLeadSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          Name <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Enter lead name"
                          value={manualLead.name}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          Email <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="email@example.com"
                          value={manualLead.email}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          Phone <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="+1 (555) 123-4567"
                          value={manualLead.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="source">
                          Lead Source
                        </Label>
                        <Select
                          value={manualLead.source}
                          onValueChange={(value) => setManualLead(prev => ({ ...prev, source: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Website">Website</SelectItem>
                            <SelectItem value="Referral">Referral</SelectItem>
                            <SelectItem value="Social Media">Social Media</SelectItem>
                            <SelectItem value="Event">Event</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="interestedCountry">
                          interestedCountry
                        </Label>
                        <Input
                          id="interestedCountry"
                          name="interestedCountry"
                          placeholder="Country"
                          value={manualLead.interestedCountry}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="course">
                          course
                        </Label>
                        <Input
                          id="course"
                          name="course"
                          placeholder="Job title"
                          value={manualLead.course}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">
                          Notes
                        </Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          placeholder="Additional information about the lead"
                          value={manualLead.notes}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        size="lg"
                        disabled={isProcessing || !selectedTeam}
                        className="relative"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Lead
                          </>
                        )}
                        
                        {/* Success animation overlay */}
                        {showSuccessAnimation && (
                          <motion.div 
                            className="absolute inset-0 flex items-center justify-center bg-green-500 text-white rounded-md"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Lead Added!
                          </motion.div>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
                
                {/* Team Members Preview */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    Team Members
                  </h3>
                  
                  {!selectedTeam ? (
                    <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No team selected</AlertTitle>
                      <AlertDescription>
                        Please select a team to manage leads
                      </AlertDescription>
                    </Alert>
                  ) : teamMembers.length === 0 ? (
                    <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No team members</AlertTitle>
                      <AlertDescription>
                        This team has no members to assign leads to
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-2">
                        {teamMembers.map((member) => (
                          <Card key={member.id} className="p-3">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{member.name}</p>
                                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                              </div>
                              <div className="flex flex-col items-end">
                                <Badge variant="outline" className="mb-1">
                                  {member.leadCount || 0} Leads
                                </Badge>
                                <div className="flex items-center text-xs text-gray-500">
                                  <span className="mr-1">Capacity:</span>
                                  <Progress 
                                    value={(member.leadCount || 0) * 5} 
                                    max={100} 
                                    className="h-1.5 w-16"
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  
                  <div className="pt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Team Member
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
      
      {/* Recent Leads Table */}
      <div className="mt-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Recent Leads</CardTitle>
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="inProgress">In Progress</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="notInterested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="gap-1">
                  <ListFilter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.status === 'new' && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">New</Badge>
                      )}
                      {lead.status === 'inProgress' && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">In Progress</Badge>
                      )}
                      {lead.status === 'qualified' && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Qualified</Badge>
                      )}
                      {lead.status === 'followUp1' && (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Follow Up</Badge>
                      )}
                      {lead.status === 'notInterested' && (
                        <Badge variant="outline" className="text-gray-500">Not Interested</Badge>
                      )}
                    </TableCell>
                    <TableCell>{lead.source || 'Unknown'}</TableCell>
                    <TableCell>
                      {lead.assignedTo ? (
                        teamMembers.find(m => m.id === lead.assignedTo)?.name || 'Unknown'
                      ) : (
                        <Badge variant="outline" className="text-gray-500">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {lead.createdAt?.toLocaleDateString() || 'Unknown'}
                        <p className="text-xs text-gray-500">
                          {lead.createdAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                        </p>
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
                            View Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Lead
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Change Status
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="mr-2 h-4 w-4" />
                            Reassign
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex justify-center mt-6">
              <Button variant="outline">
                View All Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
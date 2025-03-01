'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRBAC } from '@/hooks/auth/useRBAC';
import { redirect } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const { hasRole, loading } = useRBAC();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [settings, setSettings] = useState({
    // Lead Distribution Settings
    defaultDistributionMethod: 'round-robin',
    enableLeadCapPerDay: false,
    maxLeadsPerDay: 20,
    prioritizeHighPerformers: false,
    highPerformerThreshold: 70, // Conversion rate percentage
    
    // Follow-up Rules
    followUpIntervals: [2, 5, 10], // Days for follow-up 1, 2, 3
    maxFollowUps: 3,
    autoReassignDeadLeads: false,
    deadLeadThreshold: 30, // Days
    
    // Notification Settings
    emailNotifications: true,
    dailyLeadSummary: true,
    lowPerformanceAlerts: true,
    
    // Team Quotas
    enableTeamQuotas: false,
    weeklyLeadQuota: 100,
    weeklyConversionTarget: 30, // Percentage
  });
  
  // Load teams managed by the current user
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
  }, [user]);
  
  // Load settings for the selected team
  useEffect(() => {
    const fetchSettings = async () => {
      if (!selectedTeam) return;
      
      try {
        setIsLoading(true);
        
        // Get settings document for the selected team
        const settingsDoc = await getDoc(doc(db, 'teamSettings', selectedTeam));
        
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data();
          // Merge with default settings
          setSettings(prev => ({
            ...prev,
            ...settingsData
          }));
        } else {
          // If no settings document exists, use defaults
          // We could create a default document here if needed
          console.log('No settings found for this team, using defaults');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [selectedTeam]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? Number(value) 
          : value
    }));
  };
  
  const handleSaveSettings = async () => {
    if (!selectedTeam) {
      toast.error('Please select a team first');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Update or create settings document for the team
      await updateDoc(doc(db, 'teamSettings', selectedTeam), {
        ...settings,
        updatedAt: new Date(),
        updatedBy: user?.uid
      });
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Just for updating follow-up intervals
  const handleFollowUpIntervalChange = (index: number, value: number) => {
    const newIntervals = [...settings.followUpIntervals];
    newIntervals[index] = value;
    
    setSettings(prev => ({
      ...prev,
      followUpIntervals: newIntervals
    }));
  };
  
  if (loading) {
    return <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>;
  }
  
  if (!hasRole('sales_manager') && !hasRole('admin')) {
    redirect('/dashboard');
    return null;
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600">Configure lead distribution rules and team settings</p>
      </div>
      
      {/* Team Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Team to Configure
        </label>
        <select
          className="w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
        >
          <option value="">Select a team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {selectedTeam && (
            <div className="space-y-6">
              {/* Lead Distribution Settings */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">Lead Distribution Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Distribution Method
                    </label>
                    <select
                      name="defaultDistributionMethod"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={settings.defaultDistributionMethod}
                      onChange={handleInputChange}
                    >
                      <option value="round-robin">Round Robin</option>
                      <option value="capacity-based">Capacity Based</option>
                      <option value="manual">Manual Assignment</option>
                    </select>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="enableLeadCapPerDay"
                        name="enableLeadCapPerDay"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={settings.enableLeadCapPerDay}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="enableLeadCapPerDay" className="font-medium text-gray-700">
                        Enable Daily Lead Cap per Telemarketer
                      </label>
                      <p className="text-gray-500">Limit the number of leads assigned per day</p>
                    </div>
                  </div>
                  
                  {settings.enableLeadCapPerDay && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Leads Per Day
                      </label>
                      <input
                        type="number"
                        name="maxLeadsPerDay"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={settings.maxLeadsPerDay}
                        onChange={handleInputChange}
                        min="1"
                        max="100"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="prioritizeHighPerformers"
                        name="prioritizeHighPerformers"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={settings.prioritizeHighPerformers}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="prioritizeHighPerformers" className="font-medium text-gray-700">
                        Prioritize High Performers
                      </label>
                      <p className="text-gray-500">Send more leads to telemarketers with high conversion rates</p>
                    </div>
                  </div>
                  
                  {settings.prioritizeHighPerformers && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        High Performer Threshold (%)
                      </label>
                      <input
                        type="number"
                        name="highPerformerThreshold"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={settings.highPerformerThreshold}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Telemarketers with conversion rates above this threshold will receive more leads
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Follow-up Rules */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">Follow-up Rules</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Number of Follow-ups
                    </label>
                    <input
                      type="number"
                      name="maxFollowUps"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={settings.maxFollowUps}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Follow-up Intervals (days)
                    </label>
                    <div className="flex space-x-4">
                      {settings.followUpIntervals.map((interval, index) => (
                        <div key={index} className="w-20">
                          <label className="block text-xs text-gray-500 mb-1">
                            {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'} Follow-up
                          </label>
                          <input
                            type="number"
                            className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            value={interval}
                            onChange={(e) => handleFollowUpIntervalChange(index, parseInt(e.target.value))}
                            min="1"
                            max="30"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="autoReassignDeadLeads"
                        name="autoReassignDeadLeads"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={settings.autoReassignDeadLeads}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="autoReassignDeadLeads" className="font-medium text-gray-700">
                        Auto-reassign Dead Leads
                      </label>
                      <p className="text-gray-500">Automatically reassign leads with no activity after a threshold</p>
                    </div>
                  </div>
                  
                  {settings.autoReassignDeadLeads && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dead Lead Threshold (days)
                      </label>
                      <input
                        type="number"
                        name="deadLeadThreshold"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={settings.deadLeadThreshold}
                        onChange={handleInputChange}
                        min="1"
                        max="90"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Notification Settings */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">Notification Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="emailNotifications"
                        name="emailNotifications"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={settings.emailNotifications}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                        Email Notifications
                      </label>
                      <p className="text-gray-500">Receive email notifications about important events</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="dailyLeadSummary"
                        name="dailyLeadSummary"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={settings.dailyLeadSummary}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="dailyLeadSummary" className="font-medium text-gray-700">
                        Daily Lead Summary
                      </label>
                      <p className="text-gray-500">Receive daily summary of lead activities and conversions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="lowPerformanceAlerts"
                        name="lowPerformanceAlerts"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={settings.lowPerformanceAlerts}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="lowPerformanceAlerts" className="font-medium text-gray-700">
                        Low Performance Alerts
                      </label>
                      <p className="text-gray-500">Get alerted when team performance falls below targets</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Team Quotas */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">Team Quotas</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="enableTeamQuotas"
                        name="enableTeamQuotas"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={settings.enableTeamQuotas}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="enableTeamQuotas" className="font-medium text-gray-700">
                        Enable Team Quotas
                      </label>
                      <p className="text-gray-500">Set weekly lead and conversion targets for the team</p>
                    </div>
                  </div>
                  
                  {settings.enableTeamQuotas && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weekly Lead Quota
                        </label>
                        <input
                          type="number"
                          name="weeklyLeadQuota"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          value={settings.weeklyLeadQuota}
                          onChange={handleInputChange}
                          min="1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weekly Conversion Target (%)
                        </label>
                        <input
                          type="number"
                          name="weeklyConversionTarget"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          value={settings.weeklyConversionTarget}
                          onChange={handleInputChange}
                          min="1"
                          max="100"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
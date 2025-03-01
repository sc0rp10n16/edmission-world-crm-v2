// components/layouts/DashboardLayout.tsx
'use client';

import { useState, useEffect } from 'react';

type UserRole = 'admin' | 'sales_manager' | 'telemarketer' | 'counselor' | 'student';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Menu, 
  UserCircle,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRBAC } from '@/hooks/auth/useRBAC';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { hasRole } = useRBAC();
  
  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarExpanded(false);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Navigation items - shown based on role
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      active: pathname === '/dashboard',
      roles: ['admin', 'sales_manager', 'telemarketer', 'counselor', 'student'],
    },
    {
      name: 'Teams',
      href: '/sales-manager/teams',
      icon: <Users size={20} />,
      active: pathname === '/sales-manager/teams',
      roles: ['admin', 'sales_manager'],
    },
    {
      name: 'Leads',
      href: '/sales-manager/leads',
      icon: <FileText size={20} />,
      active: pathname === '/sales-manager/leads',
      roles: ['admin', 'sales_manager'],
    },
    // {
    //   name: 'Analytics',
    //   href: '/sales-manager/analytics',
    //   icon: <BarChart3 size={20} />,
    //   active: pathname === '/sales-manager/analytics',
    //   roles: ['admin', 'sales_manager'],
    // },
    {
      name: 'My Leads',
      href: '/telemarketer/leads',
      icon: <FileText size={20} />,
      active: pathname === '/telemarketer/leads',
      roles: ['telemarketer'],
    },
    {
      name: 'Quota',
      href: '/telemarketer/quota',
      icon: <BarChart3 size={20} />,
      active: pathname === '/telemarketer/quota',
      roles: ['telemarketer'],
    },
    {
      name: 'Applications',
      href: '/counselor/applications',
      icon: <FileText size={20} />,
      active: pathname === '/counselor/applications',
      roles: ['counselor'],
    },
    {
      name: 'Documents',
      href: '/counselor/documents',
      icon: <FileText size={20} />,
      active: pathname === '/counselor/documents',
      roles: ['counselor'],
    },
    {
      name: 'My Application',
      href: '/student/application',
      icon: <FileText size={20} />,
      active: pathname === '/student/application',
      roles: ['student'],
    },
    {
      name: 'Upload Documents',
      href: '/student/documents',
      icon: <FileText size={20} />,
      active: pathname === '/student/documents',
      roles: ['student'],
    },
    // {
    //   name: 'Settings',
    //   href: '/settings',
    //   icon: <Settings size={20} />,
    //   active: pathname === '/settings',
    //   roles: ['admin', 'sales_manager', 'telemarketer', 'counselor', 'student'],
    // },
  ];
  
  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => {
    // If no roles specified, show to everyone
    if (!item.roles) return true;
    return item.roles.some(role => hasRole(role as UserRole));
    
  });

  return (
    <div className="h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b bg-white dark:bg-gray-950 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center space-x-4">
          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu size={20} />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="h-16 border-b flex items-center px-6">
                <h2 className="text-lg font-semibold">Edmissions World</h2>
              </div>
              <nav className="px-2 py-4">
                {filteredNavItems.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 text-sm ${
                      item.active 
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ))}
                <div className="mt-4 pt-4 border-t">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut size={20} />
                    <span>Log Out</span>
                  </button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-semibold flex items-center">
              <span className="text-primary bg-blue-100 p-1 rounded text-blue-600 mr-2">Edmissions World</span>
            </Link>
          </div>
        </div>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex items-center max-w-md flex-1 mx-8">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              type="search" 
              placeholder="Search..." 
              className="w-full bg-gray-50 pl-9 focus-visible:ring-blue-500" 
            />
          </div>
        </div>

        {/* Right side icons */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            <span className="sr-only">Notifications</span>
          </Button>
          
          <Button variant="ghost" size="icon">
            <MessageSquare size={20} />
            <span className="sr-only">Messages</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-8 flex items-center gap-2 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-flex text-sm font-medium">
                  {user?.name || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <aside 
          className={`hidden lg:flex flex-col border-r bg-white dark:bg-gray-950 ${
            sidebarExpanded ? 'w-60' : 'w-16'
          } transition-all duration-300`}
        >
          <div className="p-3 flex flex-col flex-1 overflow-y-auto">
            <nav className="space-y-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                    item.active 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  {sidebarExpanded && <span className="text-sm">{item.name}</span>}
                </Link>
              ))}
            </nav>

            <div className="mt-auto">
              <Button
                variant="ghost"
                size="sm"
                className="w-full flex justify-center p-2"
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
              >
                {sidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
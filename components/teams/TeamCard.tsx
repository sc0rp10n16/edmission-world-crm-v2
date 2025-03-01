// components/teams/TeamCard.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Edit, Trash2, Sparkles } from 'lucide-react';

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    leadCount: number;
    conversionRate: string;
    createdAt?: { toDate: () => Date };
  };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
}

export default function TeamCard({ team, isSelected, onSelect, onDelete }: TeamCardProps) {
  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <div 
        className={`absolute top-0 left-0 w-1 h-full ${
          isSelected ? 'bg-blue-500' : 'bg-gray-200'
        }`}
      ></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle>{team.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()} // Prevent triggering card click
              >
                <span className="sr-only">Open menu</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                // Edit team functionality
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(team.id);
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
      {team.createdAt && (
        <CardFooter className="pt-0 text-xs text-gray-500">
          Created: {team.createdAt.toDate().toLocaleDateString()}
        </CardFooter>
      )}
    </Card>
  );
}
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Phone } from "lucide-react";
import { CallForm } from "./call-form";
import { formatPhoneNumber } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export function CallDialog({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Phone className="h-4 w-4 mr-2" />
        Call
      </Button>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Call {lead.name}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setOpen(false)}
            >
              <Phone className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4 border-y">
          <div>
            <p className="text-sm text-muted-foreground">Contact Details</p>
            <p className="font-medium">{formatPhoneNumber(lead.phone)}</p>
            {lead.email && (
              <p className="text-sm text-muted-foreground">{lead.email}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Contact</p>
            <p className="font-medium">Never contacted</p>
            <p className="text-sm text-muted-foreground">0 previous attempts</p>
          </div>
        </div>

        <CallForm 
          lead={lead} 
          
        />
      </DialogContent>
    </Dialog>
  );
}
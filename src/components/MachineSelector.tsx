import React from 'react';
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Machine {
  id: string;
  name: string;
}

interface MachineSelectorProps {
  onSelect: (machineId: string) => void;
}

const MachineSelector: React.FC<MachineSelectorProps> = ({ onSelect }) => {
  const { data: machines, isLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as Machine[];
    },
  });

  return (
    <div className="w-full max-w-xs">
      <Select onValueChange={onSelect} disabled={isLoading}>
        <SelectTrigger className="w-full bg-secondary text-secondary-foreground">
          <SelectValue placeholder="Select a machine" />
        </SelectTrigger>
        <SelectContent>
          {machines?.map((machine) => (
            <SelectItem key={machine.id} value={machine.id}>
              {machine.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MachineSelector;
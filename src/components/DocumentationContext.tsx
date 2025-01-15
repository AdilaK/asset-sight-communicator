import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Book, Shield } from 'lucide-react';

interface DocumentationContextProps {
  machineId: string | null;
}

const DocumentationContext: React.FC<DocumentationContextProps> = ({ machineId }) => {
  const { data: documentation, isLoading } = useQuery({
    queryKey: ['documentation', machineId],
    queryFn: async () => {
      if (!machineId) return null;
      
      const { data, error } = await supabase
        .from('equipment_documentation')
        .select('*')
        .eq('asset_id', machineId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!machineId,
  });

  if (!machineId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-secondary/20 rounded-lg">
        <p className="text-muted-foreground">Loading documentation...</p>
      </div>
    );
  }

  if (!documentation?.length) {
    return (
      <div className="p-4 bg-secondary/20 rounded-lg">
        <p className="text-muted-foreground">No documentation available for this machine.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'manual':
        return <Book className="w-4 h-4" />;
      case 'safety_protocol':
        return <Shield className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <ScrollArea className="h-[200px] w-full rounded-md border bg-secondary/20 p-4">
      <div className="space-y-4">
        {documentation.map((doc) => (
          <div key={doc.id} className="space-y-2">
            <div className="flex items-center gap-2">
              {getIcon(doc.document_type)}
              <h3 className="text-sm font-medium">{doc.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{doc.content}</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default DocumentationContext;
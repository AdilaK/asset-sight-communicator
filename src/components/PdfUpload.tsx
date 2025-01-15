import React, { useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PdfUploadProps {
  assetId: string;
  onUploadComplete?: () => void;
}

const PdfUpload: React.FC<PdfUploadProps> = ({ assetId, onUploadComplete }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handlePdfUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    try {
      const timestamp = new Date().getTime();
      const filePath = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Upload PDF to storage
      const { error: uploadError, data } = await supabase.storage
        .from('equipment_docs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Process PDF through edge function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assetId', assetId);

      const { data: processedData, error: processError } = await supabase.functions
        .invoke('process-pdf', {
          body: formData,
        });

      if (processError) {
        throw processError;
      }

      toast({
        title: "PDF Uploaded Successfully",
        description: "The document has been processed and added to the system",
      });

      if (onUploadComplete) {
        onUploadComplete();
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload PDF",
        variant: "destructive",
      });
    }
  }, [assetId, onUploadComplete, toast]);

  return (
    <div className="flex items-center justify-center w-full">
      <Button 
        variant="secondary"
        className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-colors"
        onClick={handleButtonClick}
      >
        <Upload className="w-4 h-4" />
        Upload Documentation PDF
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handlePdfUpload}
      />
    </div>
  );
};

export default PdfUpload;
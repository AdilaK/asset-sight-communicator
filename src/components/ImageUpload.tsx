import React, { useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  onImageAnalysis: (imageData: ImageData) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageAnalysis }) => {
  const { toast } = useToast();

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create an image element to get the ImageData
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          onImageAnalysis(imageData);
        }
        
        URL.revokeObjectURL(img.src);
      };

      // Upload to Supabase Storage
      const timestamp = new Date().getTime();
      const filePath = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { error: uploadError } = await supabase.storage
        .from('equipment_images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      toast({
        title: "Image uploaded",
        description: "Analyzing equipment...",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    }
  }, [onImageAnalysis, toast]);

  return (
    <div className="flex items-center justify-center w-full">
      <label htmlFor="image-upload" className="cursor-pointer">
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Image
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </label>
    </div>
  );
};

export default ImageUpload;
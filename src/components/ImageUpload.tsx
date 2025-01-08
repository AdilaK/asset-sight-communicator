import React, { useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  onImageAnalysis: (imageData: ImageData) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageAnalysis }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

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
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          try {
            // Upload to Supabase Storage
            const timestamp = new Date().getTime();
            const filePath = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            
            const { error: uploadError, data } = await supabase.storage
              .from('equipment_images')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              throw uploadError;
            }

            console.log('Upload successful:', data);
            
            // Process the image data for analysis
            onImageAnalysis(imageData);
            
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
        }
        
        URL.revokeObjectURL(objectUrl);
      };
      
      img.src = objectUrl;
      
    } catch (error: any) {
      console.error('Image processing error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process image",
        variant: "destructive",
      });
    }
  }, [onImageAnalysis, toast]);

  return (
    <div className="flex items-center justify-center w-full">
      <Button 
        variant="default"
        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
        onClick={handleButtonClick}
      >
        <Upload className="w-4 h-4" />
        Upload Image
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
};

export default ImageUpload;
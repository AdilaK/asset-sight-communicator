import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera as CameraIcon, Scan } from "lucide-react";

interface CameraProps {
  onFrame: (imageData: ImageData, isFromCamera?: boolean) => void;
}

const Camera: React.FC<CameraProps> = ({ onFrame }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string>("");
  const [videoDimensionsSet, setVideoDimensionsSet] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setVideoDimensionsSet(true);
            setIsActive(true);
          };
        }
      } catch (err) {
        setError("Camera access denied. Please check permissions.");
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const handleAnalyze = () => {
    if (videoRef.current && canvasRef.current && videoDimensionsSet) {
      const context = canvasRef.current.getContext('2d');
      if (context && videoRef.current.videoWidth > 0) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = context.getImageData(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        onFrame(imageData, true);
      }
    }
  };

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-center text-destructive">
        <CameraIcon className="mx-auto mb-2 h-6 w-6" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg bg-secondary/20 p-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="mx-auto rounded-lg"
      />
      <canvas ref={canvasRef} className="hidden" />
      {isActive && videoDimensionsSet && (
        <div className="mt-4 flex justify-center">
          <Button 
            onClick={handleAnalyze}
            className="gap-2"
            variant="secondary"
          >
            <Scan className="h-4 w-4" />
            Analyze
          </Button>
        </div>
      )}
    </div>
  );
};

export default Camera;
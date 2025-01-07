import React, { useRef, useEffect, useState } from "react";
import { Camera } from "lucide-react";

interface CameraViewProps {
  onFrame: (imageData: ImageData, isFromCamera?: boolean) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsActive(true);
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
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const processFrame = () => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        if (context) {
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
      requestAnimationFrame(processFrame);
    };

    requestAnimationFrame(processFrame);
  }, [isActive, onFrame]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-secondary rounded-lg p-4">
        <Camera className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg shadow-lg"
      />
      <canvas ref={canvasRef} className="hidden" />
      {isActive && (
        <div className="absolute top-4 right-4">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default CameraView;
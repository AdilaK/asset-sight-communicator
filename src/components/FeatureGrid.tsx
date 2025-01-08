import React from 'react';
import { Camera, Shield, Wrench, Leaf } from "lucide-react";

const FEATURES = [
  {
    icon: <Camera className="w-4 h-4" />,
    title: "Real-time Analysis",
    description: "Instant equipment recognition and assessment through your device camera"
  },
  {
    icon: <Shield className="w-4 h-4" />,
    title: "Safety Scanner",
    description: "Automatic detection of safety issues and compliance gaps"
  },
  {
    icon: <Wrench className="w-4 h-4" />,
    title: "Condition Monitor",
    description: "Identify wear patterns and maintenance needs early"
  },
  {
    icon: <Leaf className="w-4 h-4" />,
    title: "Environmental Check",
    description: "Track emissions and identify sustainability opportunities"
  }
];

const FeatureGrid = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {FEATURES.map((feature, index) => (
        <div key={index} className="bg-secondary/50 p-3 rounded-lg text-sm">
          <div className="flex items-center gap-2 mb-1">
            {feature.icon}
            <h3 className="font-semibold">{feature.title}</h3>
          </div>
          <p className="text-xs opacity-80">{feature.description}</p>
        </div>
      ))}
    </div>
  );
};

export default FeatureGrid;
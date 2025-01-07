import React from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface Response {
  type: "identification" | "safety" | "condition" | "environmental";
  content: string;
  severity?: "info" | "warning" | "critical";
}

interface ResponseDisplayProps {
  responses: Response[];
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ responses }) => {
  const getIcon = (severity?: Response["severity"]) => {
    if (severity === "warning" || severity === "critical") {
      return <AlertTriangle className="w-5 h-5 text-warning" />;
    }
    return <CheckCircle className="w-5 h-5 text-success" />;
  };

  const getBackgroundColor = (severity?: Response["severity"]) => {
    switch (severity) {
      case "warning":
        return "bg-warning/5";
      case "critical":
        return "bg-destructive/5";
      default:
        return "bg-secondary/5";
    }
  };

  const formatContent = (content: string) => {
    return content.split(/(?:\r?\n|\r)/).map((line, i) => (
      <p key={i} className="text-gray-200">
        {line.trim()}
      </p>
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {responses.map((response, index) => (
        <div
          key={index}
          className={`p-6 rounded-lg ${getBackgroundColor(response.severity)} 
            border border-gray-700/20 backdrop-blur-sm transition-all duration-200`}
        >
          <div className="flex items-start gap-4">
            {getIcon(response.severity)}
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-3 text-gray-100">
                {response.type.charAt(0).toUpperCase() + response.type.slice(1)}
              </h3>
              <div className="space-y-2 text-gray-300">
                {formatContent(response.content)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResponseDisplay;
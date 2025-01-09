import React from "react";
import { AlertTriangle, CheckCircle, Info, ClipboardCheck, IdCard, ShieldCheck, Leaf } from "lucide-react";

interface Response {
  type: "identification" | "safety" | "condition" | "environmental";
  content: string;
  severity?: "info" | "warning" | "critical";
}

interface ResponseDisplayProps {
  responses: Response[];
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ responses }) => {
  const getIcon = (type: Response["type"], severity?: Response["severity"]) => {
    if (severity === "warning" || severity === "critical") {
      return <AlertTriangle className="w-5 h-5 text-warning" />;
    }
    if (type === "identification") {
      return <IdCard className="w-5 h-5 text-info" />;
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

  const getListIcon = (type: Response["type"]) => {
    switch (type) {
      case "identification":
        return <IdCard className="w-4 h-4 text-gray-400" />;
      case "safety":
        return <ShieldCheck className="w-4 h-4 text-gray-400" />;
      case "condition":
        return <ClipboardCheck className="w-4 h-4 text-gray-400" />;
      case "environmental":
        return <Leaf className="w-4 h-4 text-gray-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatContent = (content: string, type: Response["type"]) => {
    return content.split(/(?:\r?\n|\r)/).map((line, i) => {
      // Handle bullet points and asterisks
      const bulletPoint = line.trim().match(/^[-•*]\s(.+)/);
      if (bulletPoint) {
        return (
          <div key={i} className="flex items-center gap-2 ml-4 text-gray-200">
            {getListIcon(type)}
            <span>{bulletPoint[1]}</span>
          </div>
        );
      }
      return (
        <p key={i} className="text-gray-200">
          {line.trim()}
        </p>
      );
    });
  };

  const getTitle = (type: Response["type"]) => {
    const titles = {
      identification: "Assessment",
      safety: "Asset Identification",
      condition: "Safety Check",
      environmental: "Environmental Impact"
    };
    return titles[type] || type;
  };

  // Sort responses to ensure they appear in the correct order
  const sortedResponses = [...responses].sort((a, b) => {
    const order = ["identification", "safety", "condition", "environmental"];
    return order.indexOf(a.type) - order.indexOf(b.type);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {sortedResponses.map((response, index) => (
        <div
          key={index}
          className={`p-6 rounded-lg ${getBackgroundColor(response.severity)} 
            border border-gray-700/20 backdrop-blur-sm transition-all duration-200`}
        >
          <div className="flex items-start gap-4">
            {getIcon(response.type, response.severity)}
            <div className="flex-1">
              {getTitle(response.type) && (
                <h3 className="text-lg font-medium mb-3 text-gray-100">
                  {getTitle(response.type)}
                </h3>
              )}
              <div className="space-y-2 text-gray-300">
                {formatContent(response.content, response.type)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResponseDisplay;
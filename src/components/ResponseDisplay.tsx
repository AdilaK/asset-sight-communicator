import React from "react";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

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
      return <Info className="w-5 h-5 text-info" />;
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
    return content.split(/(?:\r?\n|\r)/).map((line, i) => {
      // Handle bullet points and asterisks
      const bulletPoint = line.trim().match(/^[-•*]\s(.+)/);
      if (bulletPoint) {
        return (
          <li key={i} className="ml-4 text-gray-200">
            {bulletPoint[1]}
          </li>
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
      identification: "Asset Identification",
      safety: "Safety Check",
      condition: "Condition Assessment",
      environmental: "Environmental Impact"
    };
    return titles[type];
  };

  // Group responses by type
  const groupedResponses = responses.reduce((acc, response) => {
    if (response.type === "environmental") {
      // Add environmental responses to condition assessment
      const conditionResponse = acc.find(r => r.type === "condition");
      if (conditionResponse) {
        conditionResponse.content += "\n\nEnvironmental Impact:\n" + response.content;
        if (response.severity === "warning" || response.severity === "critical") {
          conditionResponse.severity = response.severity;
        }
      }
      return acc;
    }
    return [...acc, response];
  }, [] as Response[]);

  // Sort responses to ensure they appear in the correct order
  const sortedResponses = groupedResponses.sort((a, b) => {
    const order = ["identification", "safety", "condition"];
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
              <h3 className="text-lg font-medium mb-3 text-gray-100">
                {getTitle(response.type)}
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
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
  const getIcon = (type: Response["type"], severity?: Response["severity"]) => {
    if (severity === "warning" || severity === "critical") {
      return <AlertTriangle className="w-5 h-5 text-warning" />;
    }
    return <CheckCircle className="w-5 h-5 text-success" />;
  };

  const getBackgroundColor = (severity?: Response["severity"]) => {
    switch (severity) {
      case "warning":
        return "bg-warning/10";
      case "critical":
        return "bg-destructive/10";
      default:
        return "bg-secondary";
    }
  };

  const formatContent = (content: string) => {
    // Split content by bullet points or numbered lists
    return content.split(/(?:\r?\n|\r)/).map((line, i) => (
      <p key={i} className="text-gray-200 mb-2">
        {line.trim()}
      </p>
    ));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {responses.map((response, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg ${getBackgroundColor(
            response.severity
          )} backdrop-blur-sm`}
        >
          <div className="flex items-start gap-3">
            {getIcon(response.type, response.severity)}
            <div className="flex-1">
              <h3 className="text-lg font-semibold capitalize mb-2">
                {response.type}
              </h3>
              <div className="text-gray-200 space-y-1">
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
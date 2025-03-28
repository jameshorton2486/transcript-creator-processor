
import React from 'react';
import { Eye, EyeOff } from "lucide-react";

interface ApiKeyVisibilityToggleProps {
  showKey: boolean;
  setShowKey: (show: boolean) => void;
}

export const ApiKeyVisibilityToggle: React.FC<ApiKeyVisibilityToggleProps> = ({
  showKey,
  setShowKey
}) => {
  return (
    <button
      type="button"
      onClick={() => setShowKey(!showKey)}
      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      aria-label={showKey ? "Hide API key" : "Show API key"}
    >
      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
};

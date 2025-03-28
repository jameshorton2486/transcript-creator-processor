
import React from 'react';
import { Eye, EyeOff } from "lucide-react";

interface ApiKeyVisibilityToggleProps {
  showKey: boolean;
  setShowKey: (show: boolean) => void;
  inputId?: string;
}

export const ApiKeyVisibilityToggle: React.FC<ApiKeyVisibilityToggleProps> = ({
  showKey,
  setShowKey,
  inputId
}) => {
  const buttonLabel = showKey ? "Hide API key" : "Show API key";
  
  return (
    <button
      type="button"
      onClick={() => setShowKey(!showKey)}
      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      aria-label={buttonLabel}
      aria-pressed={showKey}
      aria-controls={inputId}
    >
      {showKey ? (
        <EyeOff className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Eye className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="sr-only">{buttonLabel}</span>
    </button>
  );
};

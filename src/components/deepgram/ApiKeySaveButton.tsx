
import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, Check } from "lucide-react";

interface ApiKeySaveButtonProps {
  handleSaveKey: () => void;
  testingKey: boolean;
  isSaved: boolean;
  disabled?: boolean;
}

export const ApiKeySaveButton: React.FC<ApiKeySaveButtonProps> = ({
  handleSaveKey,
  testingKey,
  isSaved,
  disabled = false
}) => {
  // Determine the appropriate aria-label based on button state
  let ariaLabel = "Save API key";
  if (testingKey) ariaLabel = "Testing API key, please wait";
  if (isSaved) ariaLabel = "API key has been saved";
  
  return (
    <Button 
      size="sm" 
      variant="outline"
      onClick={handleSaveKey}
      className="gap-1"
      disabled={disabled || testingKey}
      aria-label={ariaLabel}
      aria-busy={testingKey}
    >
      {testingKey ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" aria-hidden="true"></span>
          <span>Validating...</span>
        </>
      ) : isSaved ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
          <span>Saved</span>
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Save Key</span>
        </>
      )}
    </Button>
  );
};

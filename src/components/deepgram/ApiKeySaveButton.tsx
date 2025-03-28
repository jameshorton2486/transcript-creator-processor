
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
  return (
    <Button 
      size="sm" 
      variant="outline"
      onClick={handleSaveKey}
      className="gap-1"
      disabled={disabled || testingKey}
    >
      {testingKey ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></span>
          Validating...
        </>
      ) : isSaved ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          Saved
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5" />
          Save Key
        </>
      )}
    </Button>
  );
};

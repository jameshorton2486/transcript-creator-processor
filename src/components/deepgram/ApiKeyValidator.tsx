
import React from 'react';
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiKeyValidatorProps {
  keyStatus: 'untested' | 'valid' | 'invalid';
  keyErrorMessage?: string;
  keyFormatValid?: boolean;
  showAlert: boolean;
  errorId?: string;
}

export const ApiKeyValidator: React.FC<ApiKeyValidatorProps> = ({
  keyStatus,
  keyErrorMessage,
  keyFormatValid,
  showAlert,
  errorId
}) => {
  if (showAlert) {
    return (
      <Alert 
        variant="destructive" 
        className="py-2" 
        role="alert" 
        id={errorId}
      >
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          {keyErrorMessage || "Please enter a valid Deepgram API key"}
        </AlertDescription>
      </Alert>
    );
  }

  if (keyStatus === "valid" && !showAlert) {
    return (
      <Alert 
        variant="default" 
        className="bg-green-50 text-green-800 border-green-200 py-2" 
        role="status"
      >
        <AlertDescription className="flex items-center">
          <Check className="h-4 w-4 mr-2 text-green-600" aria-hidden="true" />
          API key is valid and has been saved
        </AlertDescription>
      </Alert>
    );
  }

  if (keyFormatValid && !keyStatus && !showAlert) {
    return (
      <Alert 
        variant="default" 
        className="bg-amber-50 text-amber-800 border-amber-200 py-2" 
        role="status"
      >
        <AlertDescription>
          API key format appears valid. API validation was skipped due to a network issue.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

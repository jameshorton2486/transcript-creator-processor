
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorDisplayProps {
  error: string | null;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  if (!error) return null;
  
  // Handle specific error messages to provide more helpful guidance
  let displayError = error;
  let additionalMessage = "";
  
  if (error.includes("Array buffer allocation failed")) {
    displayError = "Memory error while processing audio file";
    additionalMessage = "Your file is too large for your browser's memory. Try using a shorter audio file or converting it to a smaller format.";
  } else if (error.includes("quota")) {
    additionalMessage = "Try using a different API key or waiting before making more requests.";
  }
  
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{displayError}</p>
        {additionalMessage && <p className="text-xs italic">{additionalMessage}</p>}
      </AlertDescription>
    </Alert>
  );
};

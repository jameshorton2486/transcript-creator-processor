
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
  
  if (error.includes("Array buffer allocation failed") || error.includes("memory") || error.includes("allocation")) {
    displayError = "Memory error while processing audio file";
    additionalMessage = "Your file is too large for your browser's memory. Try using a shorter audio file, converting it to a smaller format, or breaking it into smaller segments before uploading.";
  } else if (error.includes("quota")) {
    displayError = "API quota exceeded";
    additionalMessage = "You've reached your Google API usage limit. Try using a different API key or waiting before making more requests.";
  } else if (error.includes("Network") || error.includes("internet")) {
    displayError = "Network connection error";
    additionalMessage = "Please check your internet connection and try again.";
  } else if (error.includes("unsupported file type")) {
    displayError = "Unsupported file format";
    additionalMessage = "Please use a common audio format like MP3, WAV, FLAC, or M4A.";
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

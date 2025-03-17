
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
    additionalMessage = "Your browser ran out of memory processing this audio file. The system will automatically try smaller chunks, but if the error persists, try one of these approaches:\n1. Use a shorter audio file\n2. Convert to a smaller format (MP3 instead of WAV/FLAC)\n3. Break your recording into smaller segments before uploading\n4. Try using a different browser with more memory";
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
      <AlertTitle>{displayError}</AlertTitle>
      <AlertDescription className="space-y-2 whitespace-pre-wrap">
        {additionalMessage}
      </AlertDescription>
    </Alert>
  );
};

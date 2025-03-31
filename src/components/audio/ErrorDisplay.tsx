
import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  error: string | null;
  dismissable?: boolean;
  timeout?: number;
}

export const ErrorDisplay = ({ 
  error, 
  dismissable = false,
  timeout
}: ErrorDisplayProps) => {
  const [dismissed, setDismissed] = useState(false);
  
  // Return null if no error or already dismissed
  if (!error || dismissed) return null;
  
  // Use timeout for auto-dismissal if specified
  if (timeout && typeof window !== 'undefined') {
    setTimeout(() => setDismissed(true), timeout);
  }
  
  // Process the error message to provide helpful context
  let displayError = error;
  let additionalMessage = "";
  
  // Case-insensitive pattern matching with more specific error types
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes("corrupt") || errorLower.includes("unsupported data")) {
    displayError = "Audio format not supported or corrupt";
    additionalMessage = "Deepgram couldn't process this audio file. Please ensure your file is in a supported format like MP3, WAV, or FLAC and is not corrupted. You can try converting your file to a different format using a tool like FFmpeg or Audacity.";
  } else if (errorLower.includes("invalid_auth") || errorLower.includes("authentication failed") || errorLower.includes("invalid api key")) {
    displayError = "API key authentication failed";
    additionalMessage = "Your Deepgram API key appears to be invalid. Please check that you've entered the correct key and that it has sufficient permissions.";
  } else if (errorLower.includes("insufficient_permissions")) {
    displayError = "Insufficient permissions";
    additionalMessage = "Your API key doesn't have the necessary permissions to use this feature. You might need to upgrade your Deepgram account or enable this feature in your Deepgram dashboard.";
  } else if (errorLower.includes("exceeds") && errorLower.includes("limit")) {
    displayError = "File size too large";
    additionalMessage = "The audio file exceeds Deepgram's size limits. Please reduce the file size or split the audio into smaller segments.";
  } else if (errorLower.includes("failed to fetch") || errorLower.includes("network")) {
    displayError = "Network connection error";
    additionalMessage = "Couldn't connect to the Deepgram API. Please check your internet connection or try again later. If you're using the proxy server, ensure it's running correctly.";
  } else if (errorLower.includes("cors") || errorLower.includes("cross-origin")) {
    displayError = "CORS policy error";
    additionalMessage = "Your browser is blocking direct API calls to Deepgram due to CORS restrictions. Please use the proxy server included with this application to avoid this issue. See server/README.md for setup instructions.";
  } else if (errorLower.includes("rate limit") || errorLower.includes("429")) {
    displayError = "API rate limit exceeded";
    additionalMessage = "You've hit Deepgram's rate limiting. Wait a few minutes before trying again, or reduce the frequency of your requests.";
  }
  
  // Log detailed error to console for debugging
  console.error("Transcription error details:", {
    originalError: error,
    displayError,
    timestamp: new Date().toISOString()
  });
  
  return (
    <Alert variant="destructive" className="mt-4 relative">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{displayError}</AlertTitle>
      <AlertDescription className="space-y-2 whitespace-pre-wrap">
        {additionalMessage && <p>{additionalMessage}</p>}
        {!additionalMessage && <p>{error}</p>}
      </AlertDescription>
      
      {dismissable && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute top-2 right-2 h-6 w-6 p-0" 
          onClick={() => setDismissed(true)}
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
};

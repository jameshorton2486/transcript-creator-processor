
import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";
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
  
  // Use useEffect to handle timeout-based dismissal
  useEffect(() => {
    if (timeout && error && !dismissed) {
      const timer = setTimeout(() => setDismissed(true), timeout);
      return () => clearTimeout(timer);
    }
  }, [error, dismissed, timeout]);
  
  // Return null if no error or already dismissed
  if (!error || dismissed) return null;
  
  // Process the error message to provide helpful context
  let displayError = error;
  let additionalMessage = "";
  
  // Case-insensitive pattern matching with more specific error types
  const normalizedError = error.toLowerCase();
  
  if (normalizedError.includes("corrupt") || normalizedError.includes("unsupported data")) {
    displayError = "Audio format not supported or corrupt";
    additionalMessage = "Deepgram couldn't process this audio file. Please ensure your file is in a supported format like MP3, WAV, or FLAC and is not corrupted. You can try converting your file to a different format using a tool like FFmpeg or Audacity.";
  } else if (normalizedError.includes("invalid_auth") || normalizedError.includes("authentication failed") || normalizedError.includes("invalid api key")) {
    displayError = "API key authentication failed";
    additionalMessage = "Your Deepgram API key appears to be invalid. Please check that you've entered the correct key and that it has sufficient permissions.";
  } else if (normalizedError.includes("insufficient_permissions")) {
    displayError = "Insufficient permissions";
    additionalMessage = "Your API key doesn't have the necessary permissions to use this feature. You might need to upgrade your Deepgram account or enable this feature in your Deepgram dashboard.";
  } else if (normalizedError.includes("exceeds") && normalizedError.includes("limit")) {
    displayError = "File size too large";
    additionalMessage = "The audio file exceeds Deepgram's size limits. Please reduce the file size or split the audio into smaller segments.";
  } else if (normalizedError.includes("failed to fetch") || normalizedError.includes("network")) {
    displayError = "Network connection error";
    additionalMessage = "Couldn't connect to the Deepgram API. Please check your internet connection or try again later. If you're using the proxy server, ensure it's running correctly.";
  } else if (normalizedError.includes("cors") || normalizedError.includes("cross-origin")) {
    displayError = "CORS policy error";
    additionalMessage = "Your browser is blocking direct API calls to Deepgram due to CORS restrictions. Please use the proxy server included with this application to avoid this issue. See server/README.md for setup instructions.";
  } else if (normalizedError.includes("rate limit") || normalizedError.includes("429")) {
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
        <p>{additionalMessage || error}</p>
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

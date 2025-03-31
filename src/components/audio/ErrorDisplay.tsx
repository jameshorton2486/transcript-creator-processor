
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorDisplayProps {
  error: string | null;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  if (!error) return null;
  
  // Handle specific Deepgram error messages to provide more helpful guidance
  let displayError = error;
  let additionalMessage = "";
  
  if (error.includes("corrupt or unsupported data")) {
    displayError = "Audio format not supported or corrupt";
    additionalMessage = "Deepgram couldn't process this audio file. Please ensure your file is in a supported format like MP3, WAV, or FLAC and is not corrupted. You can try converting your file to a different format using a tool like FFmpeg or Audacity.";
  } else if (error.includes("INVALID_AUTH") || error.includes("Authentication failed") || error.includes("Invalid API key")) {
    displayError = "API key authentication failed";
    additionalMessage = "Your Deepgram API key appears to be invalid. Please check that you've entered the correct key and that it has sufficient permissions.";
  } else if (error.includes("INSUFFICIENT_PERMISSIONS")) {
    displayError = "Insufficient permissions";
    additionalMessage = "Your API key doesn't have the necessary permissions to use this feature. You might need to upgrade your Deepgram account or enable this feature in your Deepgram dashboard.";
  } else if (error.includes("exceeds") && error.includes("limit")) {
    displayError = "File size too large";
    additionalMessage = "The audio file exceeds Deepgram's size limits. Please reduce the file size or split the audio into smaller segments.";
  } else if (error.includes("Failed to fetch") || error.includes("Network")) {
    displayError = "Network connection error";
    additionalMessage = "Couldn't connect to the Deepgram API. Please check your internet connection or try again later. If you're using the proxy server, ensure it's running correctly.";
  } else if (error.includes("CORS") || error.includes("cross-origin")) {
    displayError = "CORS policy error";
    additionalMessage = "Your browser is blocking direct API calls to Deepgram due to CORS restrictions. Please use the proxy server included with this application to avoid this issue. See server/README.md for setup instructions.";
  } else if (error.includes("rate limit") || error.includes("429")) {
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
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{displayError}</AlertTitle>
      <AlertDescription className="space-y-2 whitespace-pre-wrap">
        {additionalMessage}
        {!additionalMessage && <p>{error}</p>}
      </AlertDescription>
    </Alert>
  );
};

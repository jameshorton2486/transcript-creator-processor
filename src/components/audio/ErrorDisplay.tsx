
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
  } else if (error.includes("sample_rate_hertz") || error.includes("sample rate")) {
    displayError = "Audio sample rate issue";
    additionalMessage = "The application had trouble determining the correct sample rate of your audio file. This has been fixed in the latest update. Please try again, and if the issue persists, try converting your audio to a standard format like MP3 at 44.1 kHz or 48 kHz.";
  } else if (error.includes("Unable to decode audio data") || error.includes("EncodingError")) {
    displayError = "Audio decoding error";
    additionalMessage = "Your browser couldn't decode this audio format. The system will automatically try direct upload to Google's API. If the problem persists, try converting your audio to MP3 format, which is widely supported.";
  } else if (error.includes("FLAC")) {
    displayError = "FLAC processing issue";
    additionalMessage = "There was a problem processing your FLAC file. For large FLAC files (>10MB), the system will automatically split the file into smaller chunks. If you continue to see this error, try converting your FLAC file to MP3 format for better compatibility.";
  } else if (error.includes("payload size exceeds") || error.includes("10485760 bytes")) {
    displayError = "File too large for direct upload";
    additionalMessage = "Your file exceeds Google's 10MB request payload limit. The system will automatically try to process it in smaller chunks. If you continue to have issues, consider converting to MP3 format which handles chunking better.";
  } else if (error.includes("insufficient")) {
    displayError = "API privileges insufficient";
    additionalMessage = "Your Google Cloud account doesn't have sufficient privileges to use the Speech-to-Text API. Check that the API is enabled in your Google Cloud Console and that your API key has the correct permissions.";
  } else if (error.includes("rate limit") || error.includes("429")) {
    displayError = "API rate limit exceeded";
    additionalMessage = "You've hit Google's rate limiting. Wait a few minutes before trying again, or reduce the frequency of your requests.";
  } else if (error.includes("authentication") || error.includes("auth")) {
    displayError = "Authentication error";
    additionalMessage = "Your Google API key may be invalid or expired. Try generating a new API key from the Google Cloud Console.";
  } else if (error.includes("empty") || error.includes("no results")) {
    displayError = "No transcription results";
    additionalMessage = "Google's API couldn't detect any speech in the audio file. Check that your audio file contains audible speech and try again.";
  } else if (error.includes("timeout")) {
    displayError = "Request timeout";
    additionalMessage = "The transcription request took too long to complete. Try using a shorter audio file or improving your network connection.";
  }
  
  // Log detailed error to console for debugging
  console.error("Transcription error details:", {
    originalError: error,
    displayError,
    timestamp: new Date().toISOString(),
  });
  
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{displayError}</AlertTitle>
      <AlertDescription className="space-y-2 whitespace-pre-wrap">
        {additionalMessage}
        {!additionalMessage && <p className="text-xs mt-2 opacity-80">Technical details: {error}</p>}
      </AlertDescription>
    </Alert>
  );
};


import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_TRANSCRIPTION_OPTIONS } from "@/lib/config";
import { transcribeAudio, testApiKey } from "@/lib/google";

// Increased file size threshold from 10MB to 200MB
const LARGE_FILE_THRESHOLD = 200 * 1024 * 1024;

export const useTranscription = (onTranscriptCreated: (transcript: string, jsonData: any) => void) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState(DEFAULT_TRANSCRIPTION_OPTIONS);
  const [apiKey, setApiKey] = useState("");
  const [progress, setProgress] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [customTerms, setCustomTerms] = useState<string[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsBatchProcessing(selectedFile.size > LARGE_FILE_THRESHOLD);
    
    // Log file info for diagnostics
    console.log(`File selected: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
  };

  const handleDocumentFilesChange = (files: File[]) => {
    if (files && files.length > 0) {
      setDocumentFiles(files);
    }
  };

  const transcribeAudioFile = async () => {
    if (!file) {
      setError("No file selected. Please select an audio or video file first.");
      toast({
        title: "No file selected",
        description: "Please select an audio or video file first.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      setError("Google API key is required for transcription.");
      toast({
        title: "API Key Required",
        description: "Please enter your Google Speech-to-Text API key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    // Log transcription start with detailed info
    console.log(`Transcription started for: ${file.name}`);
    console.log(`File details: ${file.type}, ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Transcription options:`, options);
    console.log(`Custom terms: ${customTerms.length} terms provided`);
    
    try {
      // First, verify the API key is valid
      const isKeyValid = await testApiKey(apiKey);
      if (!isKeyValid) {
        throw new Error("API key is invalid or unauthorized");
      }
      
      const isLargeFile = file.size > LARGE_FILE_THRESHOLD;
      
      if (isLargeFile) {
        toast({
          title: "Processing large file",
          description: "Your file will be processed in batches. This may take several minutes.",
        });
        setIsBatchProcessing(true);
        console.log(`Large file (${(file.size / 1024 / 1024).toFixed(2)} MB) - using batch processing`);
      }
      
      console.log(`Starting transcription for file: ${file.name} (${file.type})`);
      
      if (customTerms.length > 0) {
        console.log(`Using ${customTerms.length} custom terms for speech adaptation`);
      }
      
      const response = await transcribeAudio(
        file, 
        apiKey, 
        options, 
        isLargeFile ? setProgress : undefined,
        customTerms
      );
      
      console.log("Transcription response received:", response);
      
      // Enhanced validation of the transcript
      const transcriptText = extractTranscriptText(response);
      
      if (transcriptText === "No transcript available" || transcriptText === "Error extracting transcript") {
        console.error("Failed to extract transcript from response:", response);
        
        // Check for empty results which might indicate audio decoding issues
        if (!response.results || 
            (response.results.channels?.[0]?.alternatives?.[0]?.transcript === "No transcript available" && 
             response.results.transcripts?.[0]?.transcript === "No transcript available")) {
          throw new Error("Unable to decode audio data. Try a different audio format or use the direct upload option.");
        }
        
        throw new Error("Failed to extract transcript from the API response.");
      }
      
      onTranscriptCreated(transcriptText, response);
      toast({
        title: "Transcription complete",
        description: "The audio has been successfully transcribed.",
      });
      
      // Log successful completion
      console.log("Transcription completed successfully");
      console.log(`Transcript length: ${transcriptText.length} characters`);
    } catch (error: any) {
      console.error("Transcription error:", error);
      
      // Enhanced error logging with context
      const errorContext = {
        file: {
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        },
        options,
        customTermsCount: customTerms.length,
        timestamp: new Date().toISOString(),
        errorMessage: error.message,
        errorStack: error.stack,
      };
      
      console.error("Detailed error context:", errorContext);
      
      let errorMessage = "Failed to transcribe file. ";
      
      if (error.message?.includes("API key")) {
        errorMessage += "Please check your API key is valid.";
      } else if (error.message?.includes("Network") || error.message?.includes("fetch")) {
        errorMessage += "Network error. Please check your internet connection.";
      } else if (error.message?.includes("quota")) {
        errorMessage += "API quota exceeded. Please try again later or use a different API key.";
      } else if (error.message?.includes("too large")) {
        errorMessage += "This file is too large for direct processing. The application will try to process it in batches.";
      } else if (error.message?.includes("unsupported file type")) {
        errorMessage += "The file format is not supported. Please use MP3, WAV, FLAC, or OGG format.";
      } else if (error.message?.includes("sample_rate_hertz") || error.message?.includes("sample rate")) {
        errorMessage += "Sample rate mismatch detected. The system will attempt to correct this automatically.";
      } else if (error.message?.includes("Unable to decode") || error.message?.includes("decode audio")) {
        errorMessage += "Your browser couldn't decode this audio format. Try uploading a different format like MP3.";
      } else if (error.message?.includes("permission") || error.message?.includes("permission_denied")) {
        errorMessage += "Google API permission denied. Ensure your API key has access to Speech-to-Text.";
      } else if (error.message?.includes("insufficient") || error.message?.includes("billing")) {
        errorMessage += "Insufficient privileges. Check if billing is enabled for your Google Cloud project.";
      } else {
        errorMessage += `Error details: ${error.message || "Unknown error"}`;
      }
      
      setError(errorMessage);
      toast({
        title: "Transcription failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsBatchProcessing(false);
      setProgress(0);
      console.log("Transcription process completed (success or error)");
    }
  };

  return {
    file,
    isLoading,
    error,
    options,
    apiKey,
    progress,
    isBatchProcessing,
    customTerms,
    documentFiles,
    handleFileSelected,
    transcribeAudioFile,
    setOptions,
    setApiKey,
    setError,
    setCustomTerms,
    handleDocumentFilesChange
  };
};

// Import this here to avoid circular dependencies
import { extractTranscriptText } from "@/lib/google";

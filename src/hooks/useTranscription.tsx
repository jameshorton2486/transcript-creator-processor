
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_TRANSCRIPTION_OPTIONS } from "@/lib/config";
import { transcribeAudio, testApiKey } from "@/lib/google";

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
    setIsBatchProcessing(selectedFile.size > 10 * 1024 * 1024);
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
    
    try {
      // First, verify the API key is valid
      const isKeyValid = await testApiKey(apiKey);
      if (!isKeyValid) {
        throw new Error("API key is invalid or unauthorized");
      }
      
      const isLargeFile = file.size > 10 * 1024 * 1024;
      
      if (isLargeFile) {
        toast({
          title: "Processing large file",
          description: "Your file will be processed in batches. This may take several minutes.",
        });
        setIsBatchProcessing(true);
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
      
      const transcriptText = extractTranscriptText(response);
      
      if (transcriptText === "No transcript available" || transcriptText === "Error extracting transcript") {
        throw new Error("Failed to extract transcript from the API response.");
      }
      
      onTranscriptCreated(transcriptText, response);
      toast({
        title: "Transcription complete",
        description: "The audio has been successfully transcribed.",
      });
    } catch (error: any) {
      console.error("Transcription error:", error);
      
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

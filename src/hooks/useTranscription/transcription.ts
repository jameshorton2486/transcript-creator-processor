
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_TRANSCRIPTION_OPTIONS, TranscriptionOptions } from "@/lib/config";
import { transcribeAudio, testApiKey } from "@/lib/google";
import { formatErrorMessage, createErrorContext } from "./errorHandling";
import { validateTranscript } from "./transcriptValidation";
import { safePromise } from "./promiseUtils";

export const performTranscription = async (
  file: File | null,
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  customTerms: string[] = [],
  onProgressUpdate: (progress: number) => void,
  onLoadingUpdate: (isLoading: boolean) => void,
  onBatchProcessingUpdate: (isBatchProcessing: boolean) => void,
  onErrorUpdate: (error: string | null) => void,
  onSuccess: (transcript: string, jsonData: any) => void,
  toast: ReturnType<typeof useToast>["toast"]
) => {
  if (!file) {
    onErrorUpdate("No file selected. Please select an audio or video file first.");
    toast({
      title: "No file selected",
      description: "Please select an audio or video file first.",
      variant: "destructive",
    });
    return;
  }

  if (!apiKey) {
    onErrorUpdate("Google API key is required for transcription.");
    toast({
      title: "API Key Required",
      description: "Please enter your Google Speech-to-Text API key.",
      variant: "destructive",
    });
    return;
  }

  onLoadingUpdate(true);
  onErrorUpdate(null);
  onProgressUpdate(0);
  
  // Log transcription start with detailed info
  console.log(`Transcription started for: ${file.name}`);
  console.log(`File details: ${file.type}, ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Transcription options:`, options);
  console.log(`Custom terms: ${customTerms.length} terms provided`);
  
  // Auto-retry logic for encoding issues
  let autoRetryAttempted = false;
  
  const attemptTranscription = async (retryWithAutoDetect = false) => {
    try {
      // First, verify the API key is valid
      const isKeyValid = await safePromise(testApiKey(apiKey));
      if (!isKeyValid) {
        throw new Error("API key is invalid or unauthorized");
      }
      
      const isLargeFile = file.size > 200 * 1024 * 1024; // 200MB
      
      if (isLargeFile) {
        toast({
          title: "Processing large file",
          description: "Your file will be processed in batches. This may take several minutes.",
        });
        onBatchProcessingUpdate(true);
        console.log(`Large file (${(file.size / 1024 / 1024).toFixed(2)} MB) - using batch processing`);
      }
      
      console.log(`Starting transcription for file: ${file.name} (${file.type})`);
      
      if (customTerms.length > 0) {
        console.log(`Using ${customTerms.length} custom terms for speech adaptation`);
      }
      
      // If retrying with auto-detect, modify the options
      const transcriptionOptions = retryWithAutoDetect 
        ? { ...options, encoding: 'AUTO' }
        : options;
      
      // Progress tracking helper
      const normalizeProgress = (progress: number) => {
        // Ensure progress is between 0 and 100
        const normalized = Math.min(Math.max(Math.round(progress), 0), 100);
        onProgressUpdate(normalized);
      };
      
      // Use safePromise to handle potential promise errors
      const response = await safePromise(
        transcribeAudio(
          file, 
          apiKey, 
          transcriptionOptions, 
          normalizeProgress, // Always use progress tracking
          customTerms
        )
      );
      
      console.log("Transcription response received:", response);
      
      // Reset progress to complete state
      onProgressUpdate(100);
      
      // Enhanced validation of the transcript
      const transcriptText = validateTranscript(response);
      
      console.log("Final transcript validation successful:", { 
        length: transcriptText?.length, 
        sample: transcriptText?.substring(0, 100),
        hasTranscript: Boolean(transcriptText)
      });
      
      // Make sure we have a valid transcript string
      if (!transcriptText || typeof transcriptText !== 'string') {
        throw new Error("No valid transcript text was generated from the audio");
      }
      
      // Send the transcript data to the caller
      onSuccess(transcriptText, response);
      
      toast({
        title: "Transcription complete",
        description: "The audio has been successfully transcribed.",
      });
      
      // Log successful completion
      console.log("Transcription completed successfully");
      console.log(`Transcript length: ${transcriptText?.length} characters`);
    } catch (error: any) {
      console.error("Transcription error:", error);
      
      // Detect encoding error and auto-retry
      if (!autoRetryAttempted && 
          error.message && 
          (error.message.includes("Encoding in RecognitionConfig") || 
           error.message.includes("encoding mismatch"))) {
        
        console.log("Encoding issue detected, automatically retrying with auto-detection");
        toast({
          title: "Retrying transcription",
          description: "Encoding issue detected. Automatically retrying with auto-detection.",
        });
        
        autoRetryAttempted = true;
        return await attemptTranscription(true);
      }
      
      // Enhanced error logging with context
      const errorContext = createErrorContext(file, options, customTerms, error);
      console.error("Detailed error context:", errorContext);
      
      const errorMessage = formatErrorMessage(error);
      
      onErrorUpdate(errorMessage);
      toast({
        title: "Transcription failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  try {
    await attemptTranscription();
  } finally {
    // Only update loading state AFTER transcription is complete
    onLoadingUpdate(false);
    onBatchProcessingUpdate(false);
    onProgressUpdate(0); // Reset progress when done
    console.log("Transcription process completed (success or error)");
  }
};

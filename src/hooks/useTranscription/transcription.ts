
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_TRANSCRIPTION_OPTIONS, TranscriptionOptions } from "@/lib/config";
import { transcribeAudio, testApiKey } from "@/lib/google";
import { formatErrorMessage, validateTranscript, createErrorContext, safePromise } from "./utils";

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
      
      // This makes sure the options passed to Google API are properly structured
      // to include diarization (speaker identification) settings
      const speechConfig = {
        enableAutomaticPunctuation: transcriptionOptions.punctuate,
        enableSpeakerDiarization: transcriptionOptions.diarize,
        enableWordTimeOffsets: transcriptionOptions.diarize || transcriptionOptions.enableWordTimeOffsets,
        diarizationSpeakerCount: 2, // Default to 2 speakers, can be adjusted
        model: 'latest_long',
        languageCode: 'en-US'
      };
      
      console.log("Using speech config:", speechConfig);
      
      // Use safePromise to handle potential promise errors
      const response = await safePromise(
        transcribeAudio(
          file, 
          apiKey, 
          transcriptionOptions, 
          isLargeFile ? (progress) => onProgressUpdate(progress) : undefined,
          customTerms
        )
      );
      
      console.log("Transcription response received:", response);
      
      // Enhanced validation of the transcript
      const transcriptText = validateTranscript(response);
      
      onSuccess(transcriptText, response);
      toast({
        title: "Transcription complete",
        description: "The audio has been successfully transcribed.",
      });
      
      // Log successful completion
      console.log("Transcription completed successfully");
      console.log(`Transcript length: ${transcriptText.length} characters`);
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
    onLoadingUpdate(false);
    onBatchProcessingUpdate(false);
    onProgressUpdate(0);
    console.log("Transcription process completed (success or error)");
  }
};

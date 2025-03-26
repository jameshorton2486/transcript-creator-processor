
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_TRANSCRIPTION_OPTIONS, TranscriptionOptions } from "@/lib/config";
import { transcribeAudio, testApiKey } from "@/lib/google";
import { formatErrorMessage, createErrorContext } from "./errorHandling";
import { validateTranscript } from "./transcriptValidation";
import { safePromise } from "./promiseUtils";
import { createWordDocument } from "@/components/transcript/docx";
import { Packer } from "docx";
import { saveAs } from "file-saver";

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
  
  console.log(`[TRANSCRIPTION] Started for: ${file.name}`);
  console.log(`[TRANSCRIPTION] File details: ${file.type}, ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  
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
      }
      
      console.log(`[TRANSCRIPTION] Starting transcription process for file: ${file.name} (${file.type})`);
      
      // If retrying with auto-detect, modify the options
      const transcriptionOptions = retryWithAutoDetect 
        ? { ...options, encoding: 'AUTO' }
        : options;
      
      // Progress tracking helper
      const normalizeProgress = (progress: number) => {
        const normalized = Math.min(Math.max(Math.round(progress), 0), 100);
        onProgressUpdate(normalized);
      };
      
      // Use the transcription service
      const response = await safePromise(
        transcribeAudio(
          file, 
          apiKey, 
          transcriptionOptions, 
          normalizeProgress,
          customTerms
        )
      );
      
      console.log("[TRANSCRIPTION] Raw transcription response received");
      
      // Reset progress to complete state
      onProgressUpdate(100);
      
      // Enhanced validation of the transcript
      console.log("[TRANSCRIPTION] Validating transcript");
      const transcriptText = validateTranscript(response);
      
      console.log("[TRANSCRIPTION] Transcript validation complete:", { 
        hasTranscript: Boolean(transcriptText),
        length: transcriptText?.length || 0, 
        sample: transcriptText ? transcriptText.substring(0, 100) + "..." : "none",
      });
      
      // Make sure we have a valid transcript string
      if (!transcriptText || typeof transcriptText !== 'string' || transcriptText.trim().length === 0) {
        throw new Error("No valid transcript text was generated from the audio");
      }
      
      // Create a filename based on the original file
      const fileName = file.name.split('.')[0] || "transcript";
      
      // IMPORTANT: Call onSuccess BEFORE trying to download the document
      // This ensures the transcript data is updated in the app even if document creation fails
      onSuccess(transcriptText, response);
      
      // Create Word document
      const doc = createWordDocument(transcriptText, fileName);
      
      // Generate and download Word document
      try {
        await Packer.toBlob(doc).then(blob => {
          saveAs(blob, `${fileName}.docx`);
          console.log("[TRANSCRIPTION] Word document downloaded successfully");
          
          toast({
            title: "Transcription Complete",
            description: "Word document has been downloaded. You can also view the transcript in the panel.",
          });
        });
      } catch (docError) {
        console.error("[TRANSCRIPTION] Error creating Word document:", docError);
        toast({
          title: "Document Creation Warning",
          description: "Transcription successful, but couldn't create Word document. You can still view and copy the text from the panel.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("[TRANSCRIPTION] Error:", error);
      
      // Detect encoding error and auto-retry
      if (!autoRetryAttempted && 
          error.message && 
          (error.message.includes("Encoding in RecognitionConfig") || 
           error.message.includes("encoding mismatch"))) {
        
        console.log("[TRANSCRIPTION] Encoding issue detected, automatically retrying with auto-detection");
        toast({
          title: "Retrying transcription",
          description: "Encoding issue detected. Automatically retrying with auto-detection.",
        });
        
        autoRetryAttempted = true;
        return await attemptTranscription(true);
      }
      
      // Enhanced error logging with context
      const errorContext = createErrorContext(file, options, customTerms, error);
      console.error("[TRANSCRIPTION] Detailed error context:", errorContext);
      
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
    onProgressUpdate(0); // Reset progress when done
    console.log("[TRANSCRIPTION] Process completed (success or error)");
  }
};

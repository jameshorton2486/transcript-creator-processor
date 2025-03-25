
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_TRANSCRIPTION_OPTIONS, TranscriptionOptions } from "@/lib/config";
import { transcribeAudio, testApiKey } from "@/lib/google";
import { formatErrorMessage, createErrorContext } from "./errorHandling";
import { validateTranscript } from "./transcriptValidation";
import { safePromise } from "./promiseUtils";
import { Document, Packer } from "docx";
import { saveAs } from 'file-saver';
import { createWordDocument } from "@/components/transcript/docxGenerator";

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
  
  console.log(`Transcription started for: ${file.name}`);
  console.log(`File details: ${file.type}, ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  
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
      
      console.log(`Starting transcription for file: ${file.name} (${file.type})`);
      
      // If retrying with auto-detect, modify the options
      const transcriptionOptions = retryWithAutoDetect 
        ? { ...options, encoding: 'AUTO' }
        : options;
      
      // Progress tracking helper
      const normalizeProgress = (progress: number) => {
        const normalized = Math.min(Math.max(Math.round(progress), 0), 100);
        onProgressUpdate(normalized);
      };
      
      const response = await safePromise(
        transcribeAudio(
          file, 
          apiKey, 
          transcriptionOptions, 
          normalizeProgress,
          customTerms
        )
      );
      
      console.log("Raw transcription response received:", response);
      
      // Reset progress to complete state
      onProgressUpdate(100);
      
      // Enhanced validation of the transcript
      const transcriptText = validateTranscript(response);
      
      console.log("Validated transcript text:", { 
        length: transcriptText?.length, 
        sample: transcriptText?.substring(0, 100),
        hasTranscript: Boolean(transcriptText),
        type: typeof transcriptText
      });
      
      // Make sure we have a valid transcript string
      if (!transcriptText || typeof transcriptText !== 'string') {
        throw new Error("No valid transcript text was generated from the audio");
      }
      
      // Create a filename based on the original file
      const fileName = file.name.split('.')[0] || "transcript";
      
      // DIRECT WORD DOCUMENT CREATION - This is the key simplification
      console.log("Creating Word document with transcript", {
        transcriptLength: transcriptText.length,
        fileName: fileName
      });
      
      try {
        // Create the Word document using the existing utility
        const doc = createWordDocument(transcriptText, fileName);
        
        // Generate and save/open the file
        console.log("Converting Word document to blob for download");
        Packer.toBlob(doc).then(blob => {
          console.log("Word document blob created, initiating download");
          saveAs(blob, `${fileName}.docx`);
          
          // Notify the user
          toast({
            title: "Transcription complete",
            description: "Word document has been created and opened for your review.",
          });
          
          // Still call onSuccess to maintain compatibility with existing code
          onSuccess(transcriptText, response);
        });
      } catch (wordError) {
        console.error("Error creating Word document:", wordError);
        toast({
          title: "Document Creation Error",
          description: "Could not create Word document. Downloading transcript as text instead.",
          variant: "destructive",
        });
        
        // Fallback to text download
        const blob = new Blob([transcriptText], { type: 'text/plain' });
        saveAs(blob, `${fileName}.txt`);
        
        // Still call onSuccess to maintain compatibility
        onSuccess(transcriptText, response);
      }
      
      console.log("Transcription processing complete, document creation initiated");
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
    onProgressUpdate(0); // Reset progress when done
    console.log("Transcription process completed (success or error)");
  }
};

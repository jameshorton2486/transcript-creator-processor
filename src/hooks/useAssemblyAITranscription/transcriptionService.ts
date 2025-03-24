
import { 
  transcribeAudio, 
  AssemblyAITranscriptionOptions 
} from "@/lib/assemblyai";
import { formatErrorMessage } from "@/hooks/useTranscription/utils";
import { AssemblyAITranscriptionHookState } from "./types";
import { UseToastReturn } from "./toastTypes";
import { saveApiKeyToStorage } from "./keyManagement";

export const handleTranscription = async (
  state: AssemblyAITranscriptionHookState,
  setState: React.Dispatch<React.SetStateAction<AssemblyAITranscriptionHookState>>,
  toast: UseToastReturn,
  abortControllerRef: React.MutableRefObject<AbortController | null>,
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void
): Promise<void> => {
  const { file, apiKey } = state;
  
  if (!file) {
    setState(prev => ({ ...prev, error: "No file selected. Please select an audio or video file first." }));
    toast.toast({
      title: "No file selected",
      description: "Please select an audio or video file first.",
      variant: "destructive",
    });
    return;
  }

  setState(prev => ({ 
    ...prev, 
    isLoading: true,
    error: null,
    progress: 0
  }));
  
  // Create an AbortController for cancellation
  abortControllerRef.current = new AbortController();
  
  try {
    // Log transcription start
    console.log(`Transcription started for: ${file.name}`);
    console.log(`File details: ${file.type}, ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Set up options
    const options: AssemblyAITranscriptionOptions = {
      speakerLabels: true,
      punctuate: true,
      formatText: true,
      onProgress: (progress) => {
        setState(prev => ({
          ...prev,
          progress: Math.min(Math.max(Math.round(progress), 0), 100) // Ensure progress is capped between 0 and 100
        }));
      },
      abortSignal: abortControllerRef.current.signal
    };
    
    // Start transcription with provided key
    const response = await transcribeAudio(file, apiKey, options);
    
    // Process the transcript text
    const transcriptText = response.results.transcripts[0].transcript;
    
    // Save API key on successful transcription
    saveApiKeyToStorage(apiKey);
    
    // Call the callback with the transcript
    onTranscriptCreated(transcriptText, response, file);
    
    toast.toast({
      title: "Transcription complete",
      description: "The audio has been successfully transcribed.",
    });
    
    console.log("Transcription completed successfully");
  } catch (error: any) {
    console.error("Transcription error:", error);
    
    const errorMessage = formatErrorMessage(error);
    
    // Set keyStatus to invalid if the error indicates an authentication issue
    if (errorMessage.toLowerCase().includes("auth") || 
        errorMessage.toLowerCase().includes("api key") || 
        errorMessage.toLowerCase().includes("token")) {
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        keyStatus: "invalid" 
      }));
    } else {
      setState(prev => ({ ...prev, error: errorMessage }));
    }
    
    toast.toast({
      title: "Transcription failed",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setState(prev => ({
      ...prev,
      isLoading: false,
      progress: 0
    }));
    abortControllerRef.current = null;
    console.log("Transcription process completed (success or error)");
  }
};

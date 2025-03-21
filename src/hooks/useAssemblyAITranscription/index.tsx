
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { 
  transcribeAudio, 
  testApiKey,
  AssemblyAITranscriptionOptions 
} from "@/lib/assemblyai";
import { formatErrorMessage } from "@/hooks/useTranscription/utils";

export interface AssemblyAITranscriptionHookState {
  file: File | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  apiKey: string;
  keyStatus: "untested" | "valid" | "invalid";
  testingKey: boolean;
}

export const useAssemblyAITranscription = (
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void
) => {
  const [state, setState] = useState<AssemblyAITranscriptionHookState>({
    file: null,
    isLoading: false,
    error: null,
    progress: 0,
    apiKey: "",
    keyStatus: "untested",
    testingKey: false
  });
  
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("assemblyai-api-key");
    if (savedApiKey) {
      setState(prev => ({ ...prev, apiKey: savedApiKey }));
      // Don't automatically test the key here to avoid unnecessary API calls
    }
  }, []);

  const handleFileSelected = (selectedFile: File) => {
    setState(prev => ({
      ...prev,
      file: selectedFile,
      error: null,
    }));
    
    console.log(`File selected: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
  };

  const verifyApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey.trim()) {
      setState(prev => ({ 
        ...prev, 
        error: "AssemblyAI API key is required for transcription.",
        keyStatus: "invalid"
      }));
      
      toast({
        title: "API Key Required",
        description: "Please enter your AssemblyAI API key.",
        variant: "destructive",
      });
      
      return false;
    }
    
    setState(prev => ({ ...prev, testingKey: true }));
    
    try {
      const isKeyValid = await testApiKey(apiKey);
      
      setState(prev => ({ 
        ...prev, 
        keyStatus: isKeyValid ? "valid" : "invalid",
        testingKey: false 
      }));
      
      if (!isKeyValid) {
        setState(prev => ({ 
          ...prev, 
          error: "Invalid API key. Please check your AssemblyAI API key and try again." 
        }));
        
        toast({
          title: "Invalid API Key",
          description: "The API key you entered is invalid. Please check your AssemblyAI API key and try again.",
          variant: "destructive",
        });
      }
      
      return isKeyValid;
    } catch (error) {
      console.error("API key verification error:", error);
      
      setState(prev => ({ 
        ...prev, 
        keyStatus: "invalid", 
        testingKey: false,
        error: "Could not verify API key. Please check your internet connection."
      }));
      
      toast({
        title: "API Key Verification Failed",
        description: "Could not verify your API key. Please check your internet connection.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const handleTestApiKey = async () => {
    const { apiKey } = state;
    const isValid = await verifyApiKey(apiKey);
    
    if (isValid) {
      // Save valid API key to localStorage for convenience
      localStorage.setItem("assemblyai-api-key", apiKey);
      
      toast({
        title: "API key is valid",
        description: "Your AssemblyAI API key is working correctly.",
      });
    }
  };

  const transcribeAudioFile = async () => {
    const { file, apiKey, keyStatus } = state;
    
    if (!file) {
      setState(prev => ({ ...prev, error: "No file selected. Please select an audio or video file first." }));
      toast({
        title: "No file selected",
        description: "Please select an audio or video file first.",
        variant: "destructive",
      });
      return;
    }

    // If key hasn't been tested or is invalid, verify it first
    if (keyStatus !== "valid") {
      const isKeyValid = await verifyApiKey(apiKey);
      if (!isKeyValid) return; // Error message already shown by verifyApiKey
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
            progress
          }));
        },
        abortSignal: abortControllerRef.current.signal
      };
      
      // Start transcription with previously verified key
      const response = await transcribeAudio(file, apiKey, options);
      
      // Process the transcript text
      const transcriptText = response.results.transcripts[0].transcript;
      
      // Save API key on successful transcription
      localStorage.setItem("assemblyai-api-key", apiKey);
      
      // Call the callback with the transcript
      onTranscriptCreated(transcriptText, response, file);
      
      toast({
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
      
      toast({
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

  const setApiKey = (apiKey: string) => {
    // Reset key status when a new key is entered
    setState(prev => ({ 
      ...prev, 
      apiKey,
      keyStatus: prev.apiKey !== apiKey ? "untested" : prev.keyStatus
    }));
  };
  
  const cancelTranscription = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        progress: 0
      }));
      
      toast({
        title: "Transcription cancelled",
        description: "The transcription process was cancelled.",
      });
    }
  };

  return {
    ...state,
    handleFileSelected,
    transcribeAudioFile,
    setApiKey,
    cancelTranscription,
    handleTestApiKey
  };
};

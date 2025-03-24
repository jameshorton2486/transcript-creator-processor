
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { verifyApiKey, loadApiKeyFromStorage } from "./keyManagement";
import { handleTranscription } from "./transcriptionService";
import { AssemblyAITranscriptionHookState, UseAssemblyAITranscriptionReturn } from "./types";
import { UseToastReturn } from "./toastTypes";

export * from "./types";

export const useAssemblyAITranscription = (
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void
): UseAssemblyAITranscriptionReturn => {
  const [state, setState] = useState<AssemblyAITranscriptionHookState>({
    file: null,
    isLoading: false,
    error: null,
    progress: 0,
    apiKey: "",
    keyStatus: "untested",
    testingKey: false
  });
  
  const toast = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = loadApiKeyFromStorage();
    if (savedApiKey) {
      setState(prev => ({ ...prev, apiKey: savedApiKey }));
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

  const handleTestApiKey = async () => {
    const { apiKey } = state;
    const isValid = await verifyApiKey(apiKey, setState, toast as unknown as UseToastReturn);
    
    if (isValid) {
      toast.toast({
        title: "API key is valid",
        description: "Your AssemblyAI API key is working correctly.",
      });
    }
  };

  const transcribeAudioFile = async () => {
    const { apiKey, keyStatus } = state;
    
    // If key hasn't been tested or is invalid, verify it first
    if (keyStatus !== "valid") {
      const isKeyValid = await verifyApiKey(apiKey, setState, toast as unknown as UseToastReturn);
      if (!isKeyValid) return; // Error message already shown by verifyApiKey
    }

    await handleTranscription(state, setState, toast as unknown as UseToastReturn, abortControllerRef, onTranscriptCreated);
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
      
      toast.toast({
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

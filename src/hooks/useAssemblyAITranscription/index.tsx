
import { useState, useEffect, useCallback } from "react";
import { 
  AssemblyAITranscriptionHookState, 
  AssemblyAITranscriptionOptions,
  UseAssemblyAITranscriptionReturn
} from "./types";
import { storeKey, getKey, verifyApiKey } from "./keyManagement";
import { transcribeAudio } from '@/lib/assemblyai/transcriber';
import { useToast } from '@/hooks/use-toast';

const initialState: AssemblyAITranscriptionHookState = {
  file: null,
  isLoading: false,
  error: null,
  progress: 0,
  apiKey: "",
  keyStatus: "untested",
  testingKey: false,
  estimatedTimeRemaining: undefined
};

export const useAssemblyAITranscription = (
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void,
  initialOptions?: Partial<AssemblyAITranscriptionOptions>
): UseAssemblyAITranscriptionReturn => {
  const [state, setState] = useState<AssemblyAITranscriptionHookState>(initialState);
  const [options, setTranscriptionOptions] = useState<AssemblyAITranscriptionOptions>({
    language: 'en',
    speakerLabels: initialOptions?.speakerLabels ?? true,
    punctuate: true,
    formatText: true,
    model: initialOptions?.model ?? 'default',
  });
  const { toast } = useToast();
  
  // Load API key from local storage on component mount
  useEffect(() => {
    const storedKey = getKey();
    if (storedKey) {
      setState(prevState => ({ 
        ...prevState, 
        apiKey: storedKey, 
        keyStatus: "untested" 
      }));
    }
  }, []);

  const setApiKey = useCallback((apiKey: string) => {
    setState(prevState => ({ ...prevState, apiKey }));
  }, []);

  const handleTestApiKey = useCallback(async () => {
    if (!state.apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your AssemblyAI API key first.",
        variant: "destructive",
      });
      return;
    }
    
    setState(prevState => ({ ...prevState, testingKey: true }));
    
    try {
      const isValid = await verifyApiKey(state.apiKey, setState, { toast });
      
      if (isValid) {
        storeKey(state.apiKey);
      }
    } catch (error) {
      console.error("API key verification error:", error);
      setState(prevState => ({ 
        ...prevState, 
        testingKey: false,
        keyStatus: "invalid" 
      }));
      
      toast({
        title: "API Key Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify API key",
        variant: "destructive",
      });
    }
  }, [state.apiKey, toast]);

  const handleFileSelected = useCallback((file: File) => {
    setState(prevState => ({
      ...prevState,
      file: file,
      error: null,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prevState => ({ ...prevState, error }));
  }, []);

  const setOptions = useCallback((newOptions: Partial<AssemblyAITranscriptionOptions>) => {
    setTranscriptionOptions(prev => ({
      ...prev,
      ...newOptions
    }));
  }, []);

  // Helper function to calculate estimated time remaining
  const updateEstimatedTimeRemaining = useCallback((progress: number, startTime: number) => {
    if (progress <= 0 || progress >= 100) {
      setState(prevState => ({ ...prevState, estimatedTimeRemaining: undefined }));
      return;
    }
    
    const elapsedMs = Date.now() - startTime;
    const totalEstimatedMs = (elapsedMs / progress) * 100;
    const remainingMs = totalEstimatedMs - elapsedMs;
    
    let timeString = "";
    if (remainingMs > 60000) {
      timeString = `~${Math.ceil(remainingMs / 60000)} min`;
    } else {
      timeString = `~${Math.ceil(remainingMs / 1000)} sec`;
    }
    
    setState(prevState => ({ ...prevState, estimatedTimeRemaining: timeString }));
  }, []);

  const transcribeAudioFile = useCallback(async () => {
    if (!state.file) {
      setError("Please select a file to transcribe.");
      toast({
        title: "No file selected",
        description: "Please select an audio file first.",
        variant: "destructive",
      });
      return;
    }

    if (!state.apiKey) {
      setError("API key is required. Please enter your API key.");
      toast({
        title: "API Key Required",
        description: "Please enter your AssemblyAI API key.",
        variant: "destructive",
      });
      return;
    }

    setState(prevState => ({ 
      ...prevState, 
      isLoading: true, 
      error: null, 
      progress: 0,
      estimatedTimeRemaining: undefined 
    }));

    const startTime = Date.now();

    try {
      const result = await transcribeAudio(
        state.file,
        state.apiKey,
        {
          language: options.language,
          speakerLabels: options.speakerLabels,
          punctuate: options.punctuate,
          formatText: options.formatText,
          model: options.model,
          onProgress: (progress: number) => {
            setState(prevState => ({ ...prevState, progress }));
            updateEstimatedTimeRemaining(progress, startTime);
          },
        }
      );

      setState(prevState => ({
        ...prevState,
        isLoading: false,
        error: null,
        progress: 100,
        estimatedTimeRemaining: undefined
      }));

      console.log("Transcription result:", result);
      
      // Make sure we have valid text to pass to the callback
      if (!result || (typeof result.text !== 'string') || result.text.trim() === '') {
        throw new Error("Invalid transcription result returned");
      }

      // Call the callback with the transcript text and full result data
      onTranscriptCreated(result.text, result, state.file);

      toast({
        title: "Transcription complete",
        description: "The audio has been successfully transcribed.",
      });
    } catch (error: any) {
      console.error("Transcription error:", error);
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        error: error.message || "Failed to transcribe audio.",
        progress: 0,
        estimatedTimeRemaining: undefined
      }));
      toast({
        title: "Transcription failed",
        description: error.message || "Failed to transcribe audio.",
        variant: "destructive",
      });
    }
  }, [state.file, state.apiKey, options, toast, onTranscriptCreated, setError, updateEstimatedTimeRemaining]);

  const cancelTranscription = useCallback(() => {
    setState(prevState => ({ 
      ...prevState, 
      isLoading: false, 
      progress: 0,
      estimatedTimeRemaining: undefined
    }));
    
    toast({
      title: "Transcription cancelled",
      description: "The transcription process has been cancelled.",
    });
  }, [toast]);

  return {
    ...state,
    handleFileSelected,
    transcribeAudioFile,
    setApiKey,
    cancelTranscription,
    handleTestApiKey,
    setOptions
  };
};


import { useState, useEffect, useCallback, useRef } from "react";
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

/**
 * Custom hook for handling AssemblyAI transcription functionality
 * 
 * This hook provides all the necessary state and functions to interact with
 * the AssemblyAI API for audio transcription. It manages API key validation,
 * file uploads, and the transcription process while providing progress updates.
 * 
 * @param onTranscriptCreated - Callback function when transcription is complete
 * @param initialOptions - Initial transcription options
 * @returns Object containing state and functions to control transcription
 */
export const useAssemblyAITranscription = (
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void,
  initialOptions?: Partial<AssemblyAITranscriptionOptions>
): UseAssemblyAITranscriptionReturn => {
  // Main state
  const [state, setState] = useState<AssemblyAITranscriptionHookState>(initialState);
  
  // Transcription options
  const [options, setOptions] = useState<AssemblyAITranscriptionOptions>({
    language: "en",
    speakerLabels: initialOptions?.speakerLabels ?? true,
    punctuate: true,
    formatText: true,
    model: initialOptions?.model ?? "default",
  });
  
  // References for managing ongoing operations
  const abortControllerRef = useRef<AbortController | null>(null);
  const transcriptionStartTimeRef = useRef<number | null>(null);
  
  // Get toast function for notifications
  const { toast } = useToast();
  
  // Load API key from localStorage on mount
  useEffect(() => {
    const stored = getKey();
    if (stored) {
      setState(prev => ({ ...prev, apiKey: stored }));
    }
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  /**
   * Updates the estimated time remaining for the transcription process
   * @param progress - Current progress percentage (0-100)
   */
  const updateEstimatedTimeRemaining = useCallback((progress: number) => {
    if (progress <= 0 || progress >= 100 || !transcriptionStartTimeRef.current) {
      setState(prev => ({ ...prev, estimatedTimeRemaining: undefined }));
      return;
    }
    
    const elapsed = Date.now() - transcriptionStartTimeRef.current;
    
    // Only start showing estimates after we have some meaningful data (10% progress)
    if (progress < 10) {
      setState(prev => ({ ...prev, estimatedTimeRemaining: undefined }));
      return;
    }
    
    // Calculate remaining time
    const total = (elapsed / progress) * 100;
    const remaining = total - elapsed;
    
    // Format the time string based on duration
    let timeText: string;
    if (remaining < 60000) {
      timeText = `~${Math.ceil(remaining / 1000)} sec`;
    } else if (remaining < 3600000) {
      timeText = `~${Math.ceil(remaining / 60000)} min`;
    } else {
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.ceil((remaining % 3600000) / 60000);
      timeText = `~${hours}h ${minutes}m`;
    }
    
    setState(prev => ({ ...prev, estimatedTimeRemaining: timeText }));
  }, []);

  /**
   * Sets the API key and resets validation status
   * @param key - AssemblyAI API key
   */
  const setApiKey = useCallback((key: string) => {
    setState(prev => ({ 
      ...prev, 
      apiKey: key,
      // Reset validation status if key changes
      keyStatus: prev.apiKey !== key ? "untested" : prev.keyStatus
    }));
  }, []);

  /**
   * Tests if the current API key is valid
   * @returns Promise<boolean> - True if key is valid
   */
  const handleTestApiKey = useCallback(async () => {
    if (!state.apiKey.trim()) {
      setState(prev => ({ ...prev, keyStatus: "invalid" }));
      toast({
        title: "API Key Required",
        description: "Please enter your AssemblyAI API key first.",
        variant: "destructive",
      });
      return false;
    }
    
    setState(prev => ({ ...prev, testingKey: true }));
    const isValid = await verifyApiKey(state.apiKey, setState, { toast });
    
    if (isValid) {
      storeKey(state.apiKey);
    }
    
    return isValid;
  }, [state.apiKey, toast]);

  /**
   * Handles file selection
   * @param file - The selected audio file
   */
  const handleFileSelected = useCallback((file: File) => {
    setState(prev => ({ 
      ...prev, 
      file, 
      error: null,
      progress: 0,
      estimatedTimeRemaining: undefined 
    }));
  }, []);

  /**
   * Initiates the transcription process
   */
  const transcribeAudioFile = useCallback(async () => {
    // Validate prerequisites
    if (!state.file) {
      setState(prev => ({ ...prev, error: "Please select a file first" }));
      toast({
        title: "No file selected",
        description: "Please select an audio file first.",
        variant: "destructive",
      });
      return;
    }

    if (!state.apiKey) {
      setState(prev => ({ ...prev, error: "Please enter your AssemblyAI API key" }));
      toast({
        title: "API Key Required",
        description: "Please enter your AssemblyAI API key.",
        variant: "destructive",
      });
      return;
    }
    
    // If key hasn't been tested yet, validate it first
    if (state.keyStatus === "untested") {
      const isValid = await handleTestApiKey();
      if (!isValid) {
        return; // Don't proceed if key is invalid
      }
    } else if (state.keyStatus === "invalid") {
      setState(prev => ({ ...prev, error: "Please enter a valid API key" }));
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid AssemblyAI API key.",
        variant: "destructive",
      });
      return;
    }

    // Reset state and prepare for transcription
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: 0,
      estimatedTimeRemaining: undefined,
    }));
    
    // Set up cancellation and timing
    abortControllerRef.current = new AbortController();
    transcriptionStartTimeRef.current = Date.now();

    try {
      // Start transcription with progress tracking
      const result = await transcribeAudio(
        state.file, 
        state.apiKey, 
        {
          ...options,
          abortSignal: abortControllerRef.current.signal,
          onProgress: (p: number) => {
            setState(prev => ({ ...prev, progress: p }));
            updateEstimatedTimeRemaining(p);
          },
        }
      );

      // Update state with success
      setState(prev => ({
        ...prev,
        isLoading: false,
        progress: 100,
        estimatedTimeRemaining: undefined,
      }));

      // Validate the result
      if (!result || !result.transcript && !result.text) {
        throw new Error("Received empty transcription result");
      }

      // Call the success callback with the appropriate transcript text
      onTranscriptCreated(
        result.transcript || result.text || "", 
        result, 
        state.file
      );
      
      toast({
        title: "Transcription complete",
        description: "The audio has been successfully transcribed.",
      });
      
    } catch (err: any) {
      // Don't update state if this was a cancellation
      if (err.name === 'AbortError') {
        return;
      }
      
      // Update state with error
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Transcription failed",
        progress: 0,
        estimatedTimeRemaining: undefined,
      }));
      
      toast({
        title: "Transcription failed",
        description: err.message || "Failed to transcribe audio.",
        variant: "destructive",
      });
    } finally {
      // Clear refs
      abortControllerRef.current = null;
      transcriptionStartTimeRef.current = null;
    }
  }, [state.file, state.apiKey, state.keyStatus, options, handleTestApiKey, updateEstimatedTimeRemaining, onTranscriptCreated, toast]);

  /**
   * Cancels an ongoing transcription process
   */
  const cancelTranscription = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    transcriptionStartTimeRef.current = null;
    
    setState(prev => ({
      ...prev,
      isLoading: false,
      progress: 0,
      estimatedTimeRemaining: undefined,
    }));
    
    toast({
      title: "Transcription cancelled",
      description: "The transcription process has been cancelled.",
    });
  }, [toast]);

  /**
   * Updates transcription options
   * @param newOptions - Partial options to update
   */
  const setTranscriptionOptions = useCallback((newOptions: Partial<AssemblyAITranscriptionOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  return {
    ...state,
    handleFileSelected,
    transcribeAudioFile,
    setApiKey,
    cancelTranscription,
    handleTestApiKey,
    setOptions: setTranscriptionOptions,
  };
};

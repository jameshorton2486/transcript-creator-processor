
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
  
  // Transcription options with better defaults
  const [options, setOptions] = useState<AssemblyAITranscriptionOptions>({
    language: initialOptions?.language ?? "en",
    speakerLabels: initialOptions?.speakerLabels ?? true,
    punctuate: initialOptions?.punctuate ?? true,
    formatText: initialOptions?.formatText ?? true,
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
      setState(prev => ({ 
        ...prev, 
        apiKey: stored,
        // Set keyStatus to "untested" initially even for stored keys
        // This will encourage re-validation before use
        keyStatus: "untested"
      }));
    }
  }, []);
  
  // Clean up on unmount or component change
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
   * with smoother estimations and more accurate predictions
   * @param progress - Current progress percentage (0-100)
   */
  const updateEstimatedTimeRemaining = useCallback((progress: number) => {
    if (progress <= 0 || progress >= 100 || !transcriptionStartTimeRef.current) {
      setState(prev => ({ ...prev, estimatedTimeRemaining: undefined }));
      return;
    }
    
    const elapsed = Date.now() - transcriptionStartTimeRef.current;
    
    // Only start showing estimates after we have some meaningful data
    // Increased threshold to 15% for more accurate predictions
    if (progress < 15) {
      setState(prev => ({ ...prev, estimatedTimeRemaining: undefined }));
      return;
    }
    
    // Calculate remaining time with a dampening factor to smooth out fluctuations
    // Use a weighted average of the current and previous estimates
    const rawTotal = (elapsed / progress) * 100;
    const dampingFactor = 0.7; // Higher value means more smoothing
    
    // Store previous estimate in a ref to enable smoothing
    const prevEstimateRef = useRef<number | null>(null);
    
    let total: number;
    if (prevEstimateRef.current === null) {
      total = rawTotal;
    } else {
      total = (dampingFactor * prevEstimateRef.current) + ((1 - dampingFactor) * rawTotal);
    }
    
    prevEstimateRef.current = total;
    
    const remaining = Math.max(0, total - elapsed); // Ensure non-negative
    
    // Format the time string based on duration with better thresholds
    let timeText: string;
    if (remaining < 30000) { // Less than 30 seconds
      timeText = `~${Math.ceil(remaining / 1000)} sec`;
    } else if (remaining < 120000) { // Less than 2 minutes
      timeText = `~${Math.round(remaining / 1000)} sec`;
    } else if (remaining < 3600000) { // Less than 1 hour
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
      keyStatus: prev.apiKey !== key ? "untested" : prev.keyStatus,
      // Clear error when key changes
      error: prev.apiKey !== key ? null : prev.error
    }));
  }, []);

  /**
   * Tests if the current API key is valid
   * @returns Promise<boolean> - True if key is valid
   */
  const handleTestApiKey = useCallback(async () => {
    const trimmedKey = state.apiKey.trim();
    if (!trimmedKey) {
      setState(prev => ({ ...prev, keyStatus: "invalid" }));
      toast({
        title: "API Key Required",
        description: "Please enter your AssemblyAI API key first.",
        variant: "destructive",
      });
      return false;
    }
    
    // Basic format validation before making network request
    if (!/^[a-zA-Z0-9]{32,}$/.test(trimmedKey)) {
      setState(prev => ({ ...prev, keyStatus: "invalid" }));
      toast({
        title: "Invalid API Key Format",
        description: "The API key appears to be in an incorrect format.",
        variant: "destructive",
      });
      return false;
    }
    
    setState(prev => ({ ...prev, testingKey: true, error: null }));
    
    try {
      const isValid = await verifyApiKey(trimmedKey, setState, { toast });
      
      if (isValid) {
        // Store key only if valid
        storeKey(trimmedKey);
        
        toast({
          title: "API Key Validated",
          description: "Your AssemblyAI API key is valid.",
          variant: "default",
        });
      }
      
      return isValid;
    } catch (error) {
      console.error("API key validation error:", error);
      toast({
        title: "Validation Error",
        description: "Could not validate API key. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ 
        ...prev, 
        testingKey: false,
        keyStatus: "untested",
        error: "API key validation failed. Please try again."
      }));
      return false;
    }
  }, [state.apiKey, toast]);

  /**
   * Handles file selection with validation
   * @param file - The selected audio file
   */
  const handleFileSelected = useCallback((file: File) => {
    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const validTypes = ['mp3', 'mp4', 'wav', 'm4a', 'flac'];
    
    if (!validTypes.includes(fileExt)) {
      toast({
        title: "Unsupported File Type",
        description: `File type .${fileExt} is not supported. Please select an audio file (MP3, MP4, WAV, M4A, FLAC).`,
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (AssemblyAI limit is 250MB)
    const maxSize = 250 * 1024 * 1024; // 250MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `File exceeds the maximum size of 250MB. Please select a smaller file.`,
        variant: "destructive",
      });
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      file, 
      error: null,
      progress: 0,
      estimatedTimeRemaining: undefined 
    }));
    
    toast({
      title: "File Selected",
      description: `"${file.name}" has been selected for transcription.`,
    });
  }, [toast]);

  /**
   * Initiates the transcription process with comprehensive validation
   */
  const transcribeAudioFile = useCallback(async () => {
    // Validate prerequisites
    if (!state.file) {
      setState(prev => ({ ...prev, error: "Please select a file first" }));
      toast({
        title: "No File Selected",
        description: "Please select an audio file first.",
        variant: "destructive",
      });
      return;
    }

    if (!state.apiKey.trim()) {
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

    // Track transcription start for analytics
    console.log(`[ASSEMBLY] Starting transcription for ${state.file.name} (${(state.file.size / 1024 / 1024).toFixed(2)}MB) using ${options.model} model`);

    try {
      // Start transcription with progress tracking
      const result = await transcribeAudio(
        state.file, 
        state.apiKey.trim(), 
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
      if (!result || (!result.transcript && !result.text)) {
        throw new Error("Received empty transcription result");
      }

      // Call the success callback with the appropriate transcript text
      onTranscriptCreated(
        result.transcript || result.text || "", 
        result, 
        state.file
      );
      
      toast({
        title: "Transcription Complete",
        description: "The audio has been successfully transcribed.",
      });
      
    } catch (err: any) {
      // Don't update state if this was a cancellation
      if (err.name === 'AbortError') {
        console.log("[ASSEMBLY] Transcription was cancelled by user");
        return;
      }
      
      // Format error message for better user experience
      let errorMessage = err.message || "Transcription failed";
      
      // Categorize different types of errors
      if (errorMessage.includes('API key') || errorMessage.includes('auth')) {
        errorMessage = "Authentication failed. Please check your API key and try again.";
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (errorMessage.includes('timeout')) {
        errorMessage = "Transcription timed out. Please try with a smaller file or try again later.";
      }
      
      // Update state with error
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        progress: 0,
        estimatedTimeRemaining: undefined,
      }));
      
      toast({
        title: "Transcription Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Log detailed error info for debugging
      console.error("[ASSEMBLY] Transcription error:", err);
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
      title: "Transcription Cancelled",
      description: "The transcription process has been cancelled.",
    });
    
    console.log("[ASSEMBLY] Transcription cancelled by user");
  }, [toast]);

  /**
   * Updates transcription options
   * @param newOptions - Partial options to update
   */
  const setTranscriptionOptions = useCallback((newOptions: Partial<AssemblyAITranscriptionOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
    
    // Log options change for debugging
    console.log("[ASSEMBLY] Transcription options updated:", newOptions);
  }, []);

  // Return all state and functions
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

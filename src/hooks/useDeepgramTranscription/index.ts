
/**
 * React hook for managing audio transcription with Deepgram API
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { transcribeAudioFile } from '../../lib/deepgram/transcriber';
import { retrieveStoredApiKey, storeApiKey, testApiKey } from '../../lib/deepgram/auth';
import { useToast } from "@/hooks/use-toast";
import {
  DeepgramTranscriptionOptions,
  DeepgramTranscriptionHookState,
  UseDeepgramTranscriptionReturn,
} from './types';
import type { TranscriptionResult } from '@/lib/deepgram/deepgramService';

// Export the new service-based hook
export { useDeepgramService } from './useDeepgramService';
export type { 
  UseDeepgramTranscriptionProps, 
  UseDeepgramTranscriptionReturn 
} from './useDeepgramService';

// Re-export types from deepgramService with 'export type'
export type { 
  DeepgramTranscriptionResponse,
  DeepgramChannel,
  DeepgramAlternative,
  DeepgramWord,
  DeepgramParagraph,
  DeepgramUtterance,
  TranscriptionResult
} from '@/lib/deepgram/deepgramService';

export function useDeepgramTranscription(
  onTranscriptCreated?: (transcript: string, jsonData: any, file?: File) => void,
  initialOptions?: Partial<DeepgramTranscriptionOptions>
): UseDeepgramTranscriptionReturn {
  const { toast } = useToast();
  const [state, setState] = useState<DeepgramTranscriptionHookState>({
    file: null,
    isLoading: false,
    error: null,
    progress: 0,
    apiKey: initialOptions?.apiKey || '',
    keyStatus: 'untested',
    testingKey: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const optionsRef = useRef<DeepgramTranscriptionOptions>(initialOptions || {});
  const resultRef = useRef<TranscriptionResult | null>(null);

  useEffect(() => {
    const storedKey = retrieveStoredApiKey();
    if (storedKey) {
      setState(prev => ({ ...prev, apiKey: storedKey }));
      handleTestApiKey(storedKey);
    }
  }, []);

  const setApiKey = useCallback((key: string) => {
    setState(prev => ({ 
      ...prev, 
      apiKey: key,
      keyStatus: key !== prev.apiKey ? 'untested' : prev.keyStatus
    }));
  }, []);

  const setOptions = useCallback((options: Partial<DeepgramTranscriptionOptions>) => {
    optionsRef.current = { ...optionsRef.current, ...options };
  }, []);

  const handleFileSelected = useCallback((file: File) => {
    setState(prev => ({ ...prev, file, error: null, progress: 0, result: undefined }));
    
    // Validate file type and size
    const validAudioTypes = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/m4a', 'audio/mp4', 'audio/x-m4a', 'audio/flac'];
    if (file && !validAudioTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|mp4|flac)$/i)) {
      setState(prev => ({ ...prev, error: 'Unsupported file type. Please use MP3, WAV, M4A, MP4, or FLAC.' }));
      toast({
        title: "Unsupported File",
        description: "Please upload an audio file (MP3, WAV, M4A, MP4, or FLAC).",
        variant: "destructive"
      });
      return;
    }

    // Check file size (100MB limit)
    if (file && file.size > 100 * 1024 * 1024) {
      setState(prev => ({ ...prev, error: 'File too large. Maximum size is 100MB.' }));
      toast({
        title: "File Too Large",
        description: "Maximum file size is 100MB. Please choose a smaller file.",
        variant: "destructive"
      });
      return;
    }

    // File is valid
    toast({
      title: "File Selected",
      description: `Ready to transcribe: ${file.name}`
    });
  }, [toast]);

  const handleTestApiKey = useCallback(async (keyToTest?: string): Promise<boolean> => {
    const key = keyToTest || state.apiKey;

    if (!key.trim()) {
      setState(prev => ({ ...prev, keyStatus: 'invalid', keyErrorMessage: 'API key is required' }));
      toast({
        title: "API Key Required",
        description: "Please enter your Deepgram API key",
        variant: "destructive"
      });
      return false;
    }

    setState(prev => ({ ...prev, testingKey: true, keyErrorMessage: undefined }));

    try {
      const result = await testApiKey(key);
      setState(prev => ({
        ...prev,
        apiKey: key,
        keyStatus: result.isValid ? 'valid' : 'invalid',
        keyErrorMessage: result.isValid ? undefined : result.message,
        testingKey: false,
      }));

      if (result.isValid) {
        storeApiKey(key);
        toast({
          title: "API Key Valid",
          description: "Your Deepgram API key has been validated and saved"
        });
      } else {
        toast({
          title: "API Key Invalid",
          description: result.message || "Please check your API key and try again",
          variant: "destructive"
        });
      }
      
      return result.isValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error validating API key';
      
      setState(prev => ({
        ...prev,
        keyStatus: 'invalid',
        keyErrorMessage: errorMessage,
        testingKey: false,
      }));
      
      toast({
        title: "API Key Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
  }, [state.apiKey, toast]);

  const transcribe = useCallback(async (): Promise<TranscriptionResult | undefined> => {
    if (!state.file) {
      setState(prev => ({ ...prev, error: 'No file selected' }));
      toast({
        title: "No File Selected",
        description: "Please select an audio file to transcribe",
        variant: "destructive"
      });
      return;
    }

    if (!state.apiKey) {
      setState(prev => ({ ...prev, error: 'API key is required' }));
      toast({
        title: "API Key Required",
        description: "Please enter your Deepgram API key",
        variant: "destructive"
      });
      return;
    }

    if (state.keyStatus !== 'valid') {
      const isValid = await handleTestApiKey();
      if (!isValid) return;
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, isLoading: true, error: null, progress: 0 }));
    toast({
      title: "Transcription Started",
      description: "Processing your audio file..."
    });

    const onProgress = (progress: number) => {
      setState(prev => ({
        ...prev,
        progress,
        estimatedTimeRemaining: calculateTimeRemaining(progress),
      }));
    };

    try {
      const result = await transcribeAudioFile(state.file, state.apiKey, {
        ...optionsRef.current,
        onProgress,
        abortSignal: abortControllerRef.current.signal,
      });

      resultRef.current = result;

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        progress: 100,
        result
      }));

      toast({
        title: "Transcription Complete",
        description: "Your audio has been successfully transcribed"
      });

      // Call onTranscriptCreated callback if provided
      if (onTranscriptCreated && result) {
        onTranscriptCreated(
          result.transcript, 
          result.rawResponse, 
          state.file
        );
      }

      return result;
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : 'Error during transcription';
      
      // Handle specific error types with more user-friendly messages
      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (errorMessage.includes('quota')) {
        errorMessage = 'API quota exceeded. Please check your Deepgram account.';
      } else if (errorMessage.includes('cancelled')) {
        errorMessage = 'Transcription was cancelled.';
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Transcription was cancelled.';
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        progress: 0,
      }));
      
      toast({
        title: "Transcription Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      console.error("Transcription error:", error);
    } finally {
      abortControllerRef.current = null;
    }
  }, [state.file, state.apiKey, state.keyStatus, handleTestApiKey, onTranscriptCreated, toast]);

  const cancelTranscription = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      setState(prev => ({ ...prev, isLoading: false, error: 'Transcription cancelled', progress: 0 }));
      
      toast({
        title: "Transcription Cancelled",
        description: "You have cancelled the transcription process"
      });
    }
  }, [toast]);

  return {
    ...state,
    handleFileSelected,
    transcribeAudioFile: transcribe,
    setApiKey,
    cancelTranscription,
    handleTestApiKey,
    setOptions,
  };
}

function calculateTimeRemaining(progress: number): string | undefined {
  if (progress <= 0 || progress >= 100) return undefined;

  const remainingSeconds = (100 - progress) * 1.5;

  if (remainingSeconds < 60) return `${Math.ceil(remainingSeconds)} seconds remaining`;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.ceil(remainingSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
}

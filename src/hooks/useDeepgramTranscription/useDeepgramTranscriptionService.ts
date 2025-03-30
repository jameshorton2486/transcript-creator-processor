
import { useState, useEffect, useCallback } from 'react';
import { validateApiKey, getSavedApiKey, saveApiKey } from '@/lib/deepgram/authService';
import {
  uploadFileForTranscription,
  checkTranscriptionStatus,
  getTranscriptionResult,
  TranscriptionResult
} from '@/lib/audio/transcriptionService';
import { useToast } from "@/hooks/use-toast";

export interface TranscriptionOptions {
  language?: string;
  punctuate?: boolean;
  diarize?: boolean;
  model?: string;
}

export interface UseDeepgramTranscriptionServiceProps {
  initialApiKey?: string;
  autoValidateKey?: boolean;
}

export interface UseDeepgramTranscriptionServiceReturn {
  apiKey: string;
  setApiKey: (key: string) => void;
  isApiKeyValid: boolean;
  isValidatingApiKey: boolean;
  apiKeyError: string | null;
  transcriptionResult: TranscriptionResult | null;
  transcriptionError: string | null;
  isTranscribing: boolean;
  transcriptionProgress: number;
  transcribeFile: (file: File, options?: TranscriptionOptions) => Promise<void>;
  resetTranscription: () => void;
  validateKey: () => Promise<boolean>;
}

/**
 * Custom hook for handling Deepgram transcription
 */
export const useDeepgramTranscriptionService = ({
  initialApiKey = '',
  autoValidateKey = true,
}: UseDeepgramTranscriptionServiceProps = {}): UseDeepgramTranscriptionServiceReturn => {
  const { toast } = useToast();
  
  // API key state
  const [apiKey, setApiKeyState] = useState<string>(initialApiKey || getSavedApiKey() || '');
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);
  const [isValidatingApiKey, setIsValidatingApiKey] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Transcription state
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<number>(0);
  const [jobId, setJobId] = useState<string | null>(null);

  // Set API key and save to localStorage
  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    saveApiKey(key);
    // Reset validation state when key changes
    setIsApiKeyValid(false);
    setApiKeyError(null);
  }, []);

  // Validate API key
  const validateKey = useCallback(async (): Promise<boolean> => {
    if (!apiKey) {
      setApiKeyError('API key is required');
      setIsApiKeyValid(false);
      toast({
        title: "API Key Required",
        description: "Please enter a Deepgram API key",
        variant: "destructive"
      });
      return false;
    }

    setIsValidatingApiKey(true);
    setApiKeyError(null);

    try {
      console.log('[DEEPGRAM] Testing API key validity...');
      const result = await validateApiKey(apiKey);
      
      setIsApiKeyValid(result.valid);
      
      if (!result.valid) {
        setApiKeyError(result.message || 'Invalid API key');
        console.error('[DEEPGRAM] API validation failed:', result.message);
        toast({
          title: "API Key Invalid",
          description: result.message || "Invalid API key",
          variant: "destructive"
        });
      } else {
        toast({
          title: "API Key Valid",
          description: "Your Deepgram API key is valid"
        });
      }
      
      return result.valid;
    } catch (error) {
      console.error('[DEEPGRAM] API validation failed due to error:', error);
      setIsApiKeyValid(false);
      const errorMessage = 'Failed to validate API key. Please check your network connection.';
      setApiKeyError(errorMessage);
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsValidatingApiKey(false);
    }
  }, [apiKey, toast]);

  // Validate API key on mount or when key changes (if autoValidateKey is true)
  useEffect(() => {
    if (apiKey && autoValidateKey) {
      validateKey();
    }
  }, [apiKey, autoValidateKey, validateKey]);

  // Transcribe file
  const transcribeFile = useCallback(async (file: File, options?: TranscriptionOptions): Promise<void> => {
    if (!isApiKeyValid) {
      const isValid = await validateKey();
      if (!isValid) {
        setTranscriptionError('Please provide a valid API key');
        return;
      }
    }

    setIsTranscribing(true);
    setTranscriptionError(null);
    setTranscriptionResult(null);
    setTranscriptionProgress(0);

    try {
      toast({
        title: "Transcription Started",
        description: `Processing ${file.name}`
      });
      
      // Upload file for transcription
      const { id } = await uploadFileForTranscription(file, apiKey, options);
      setJobId(id);

      // Poll for status and update progress
      const statusCheckInterval = setInterval(async () => {
        try {
          const status = await checkTranscriptionStatus(id, apiKey);
          
          setTranscriptionProgress(status.progress || 0);
          
          if (status.status === 'completed') {
            clearInterval(statusCheckInterval);
            const result = await getTranscriptionResult(id, apiKey);
            setTranscriptionResult(result);
            setIsTranscribing(false);
            
            toast({
              title: "Transcription Complete",
              description: "Your audio has been successfully transcribed"
            });
          } else if (status.status === 'failed') {
            clearInterval(statusCheckInterval);
            setTranscriptionError(status.error || 'Transcription failed');
            setIsTranscribing(false);
            
            toast({
              title: "Transcription Failed",
              description: status.error || "Failed to transcribe audio",
              variant: "destructive"
            });
          }
        } catch (err) {
          console.error('Error checking transcription status:', err);
        }
      }, 2000);
    } catch (error: any) {
      console.error('Transcription error:', error);
      const errorMessage = error.message || 'Failed to transcribe file';
      setTranscriptionError(errorMessage);
      setIsTranscribing(false);
      
      toast({
        title: "Transcription Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [apiKey, isApiKeyValid, validateKey, toast]);

  // Reset transcription state
  const resetTranscription = useCallback(() => {
    setTranscriptionResult(null);
    setTranscriptionError(null);
    setIsTranscribing(false);
    setTranscriptionProgress(0);
    setJobId(null);
  }, []);

  return {
    apiKey,
    setApiKey,
    isApiKeyValid,
    isValidatingApiKey,
    apiKeyError,
    transcriptionResult,
    transcriptionError,
    isTranscribing,
    transcriptionProgress,
    transcribeFile,
    resetTranscription,
    validateKey
  };
};

export default useDeepgramTranscriptionService;

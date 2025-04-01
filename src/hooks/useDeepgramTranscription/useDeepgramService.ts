
import { useState, useCallback, useRef } from 'react';
import { TranscriptionResult, DeepgramRequestOptions } from '@/lib/deepgram/types';
import { useToast } from "@/hooks/use-toast";

export interface DeepgramOptions {
  model?: string;
  language?: string;
  punctuate?: boolean;
  smart_format?: boolean;
  diarize?: boolean;
  detect_language?: boolean;
  numSpeakers?: number;
}

export interface DeepgramResponse {
  transcript: string;
  raw: any;
}

export interface UseDeepgramTranscriptionProps {
  apiKey?: string;
  onSuccess?: (result: TranscriptionResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  options?: DeepgramOptions;
}

export interface UseDeepgramTranscriptionReturn {
  transcribeFile: (file: File) => Promise<TranscriptionResult | undefined>;
  cancel: () => void;
  isLoading: boolean;
  progress: number;
  error: Error | null;
  result: TranscriptionResult | null;
  setApiKey: (apiKey: string) => void;
}

export function useDeepgramService({
  apiKey: initialApiKey,
  onSuccess,
  onError,
  onProgress,
  options: initialOptions
}: UseDeepgramTranscriptionProps = {}): UseDeepgramTranscriptionReturn {
  const [apiKey, setApiKey] = useState<string>(initialApiKey || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const { toast } = useToast();
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const optionsRef = useRef<DeepgramOptions>(initialOptions || {});

  const transcribeFile = useCallback(async (file: File): Promise<TranscriptionResult | undefined> => {
    if (!apiKey) {
      const error = new Error('API key is required');
      setError(error);
      onError?.(error);
      toast({
        title: "API Key Required",
        description: "Please provide a Deepgram API key",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);
    
    abortControllerRef.current = new AbortController();

    try {
      // Mock implementation - in a real app this would call the Deepgram API
      const mockResponse: TranscriptionResult = {
        transcript: "This is a mock transcription.",
        confidence: 0.95,
        words: [],
        paragraphs: [],
        metadata: {
          duration: 60,
          channels: 1
        }
      };
      
      // Simulate API call with progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(50);
      onProgress?.(50);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(100);
      onProgress?.(100);
      
      setResult(mockResponse);
      onSuccess?.(mockResponse);
      
      toast({
        title: "Transcription Complete",
        description: "Your audio has been successfully transcribed"
      });
      
      return mockResponse;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to transcribe file');
      setError(error);
      onError?.(error);
      
      toast({
        title: "Transcription Failed",
        description: error.message,
        variant: "destructive"
      });
      
      return undefined;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [apiKey, onSuccess, onError, onProgress, toast]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      toast({
        title: "Transcription Cancelled",
        description: "The transcription process has been cancelled"
      });
    }
  }, [toast]);

  return {
    transcribeFile,
    cancel,
    isLoading,
    progress,
    error,
    result,
    setApiKey
  };
}

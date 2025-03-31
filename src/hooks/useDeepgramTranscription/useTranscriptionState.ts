
import { useState, useCallback } from 'react';
import { 
  TranscriptionResult, 
  DeepgramAPIResponse, 
  DeepgramRequestOptions 
} from '@/lib/deepgram/types';
import { DEFAULT_OPTIONS } from '@/lib/deepgram/deepgramConfig';

interface UseTranscriptionStateReturn {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  transcription: TranscriptionResult | null;
  setTranscription: (transcription: TranscriptionResult | null) => void;
  rawResponse: DeepgramAPIResponse | null;
  setRawResponse: (response: DeepgramAPIResponse | null) => void;
  transcriptionError: string | null;
  setTranscriptionError: (error: string | null) => void;
  isTranscribing: boolean;
  setIsTranscribing: (isTranscribing: boolean) => void;
  isProcessingComplete: boolean;
  setIsProcessingComplete: (isComplete: boolean) => void;
  requestOptions: DeepgramRequestOptions;
  updateRequestOptions: (options: Partial<DeepgramRequestOptions>) => void;
  resetTranscription: () => void;
}

/**
 * Hook for managing transcription state
 */
export const useTranscriptionState = (): UseTranscriptionStateReturn => {
  // File and transcription state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawResponse, setRawResponse] = useState<DeepgramAPIResponse | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isProcessingComplete, setIsProcessingComplete] = useState<boolean>(false);
  
  // Request options
  const [requestOptions, setRequestOptions] = useState<DeepgramRequestOptions>(DEFAULT_OPTIONS);
  
  // Update transcription request options
  const updateRequestOptions = useCallback((options: Partial<DeepgramRequestOptions>) => {
    console.log("[TRANSCRIPTION STATE] Updating request options:", options);
    setRequestOptions(prev => ({
      ...prev,
      ...options
    }));
  }, []);
  
  // Reset transcription state
  const resetTranscription = useCallback(() => {
    console.log("[TRANSCRIPTION STATE] Resetting transcription state");
    setRawResponse(null);
    setTranscription(null);
    setTranscriptionError(null);
    setIsTranscribing(false);
    setIsProcessingComplete(false);
  }, []);

  return {
    selectedFile,
    setSelectedFile,
    transcription,
    setTranscription,
    rawResponse,
    setRawResponse,
    transcriptionError,
    setTranscriptionError,
    isTranscribing,
    setIsTranscribing,
    isProcessingComplete,
    setIsProcessingComplete,
    requestOptions,
    updateRequestOptions,
    resetTranscription
  };
};

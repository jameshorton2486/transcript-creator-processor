import { useState, useEffect, useCallback } from 'react';
import { 
  validateApiKey, 
  transcribeFile, 
  extractTranscriptionResult,
  apiKeyStorage
} from '@/lib/deepgram/apiHelpers';
import { TranscriptionResult, DeepgramAPIResponse, DeepgramRequestOptions } from '@/lib/deepgram/types';
import { DEFAULT_OPTIONS } from '@/lib/deepgram/deepgramConfig';
import { useApiKeyManager } from './useApiKeyManager';
import { useTranscriptionState } from './useTranscriptionState';

export interface UseDeepgramTranscriptionProps {
  initialApiKey?: string;
  autoValidateKey?: boolean;
}

export interface UseDeepgramTranscriptionReturn {
  apiKey: string;
  setApiKey: (key: string) => void;
  isApiKeyValid: boolean;
  isValidatingApiKey: boolean;
  apiKeyError: string | null;
  transcription: TranscriptionResult | null;
  rawResponse: DeepgramAPIResponse | null;
  transcriptionError: string | null;
  isTranscribing: boolean;
  isProcessingComplete: boolean;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  requestOptions: DeepgramRequestOptions;
  updateRequestOptions: (options: Partial<DeepgramRequestOptions>) => void;
  transcribeSelectedFile: () => Promise<void>;
  validateKeyManually: () => Promise<boolean>;
  resetTranscription: () => void;
  clearApiKey: () => void;
}

/**
 * Custom hook for Deepgram transcription functionality
 */
export const useDeepgramService = ({
  initialApiKey = '',
  autoValidateKey = true,
}: UseDeepgramTranscriptionProps = {}): UseDeepgramTranscriptionReturn => {
  // Use the extracted hooks for API key and transcription state management
  const {
    apiKey,
    setApiKey,
    isApiKeyValid,
    isValidatingApiKey,
    apiKeyError,
    validateKeyManually,
    clearApiKey
  } = useApiKeyManager({
    initialApiKey,
    autoValidateKey
  });

  const {
    selectedFile,
    setSelectedFile,
    transcription,
    rawResponse,
    transcriptionError,
    isTranscribing,
    isProcessingComplete,
    requestOptions,
    updateRequestOptions,
    resetTranscription
  } = useTranscriptionState();
  
  // Handle the transcription process
  const transcribeSelectedFile = useCallback(async (): Promise<void> => {
    if (!selectedFile) {
      console.log("[DEEPGRAM SERVICE] Transcription attempted with no file selected");
      setTranscriptionError('No file selected');
      return;
    }
    
    if (!isApiKeyValid) {
      console.log("[DEEPGRAM SERVICE] API key not validated yet, attempting validation...");
      const isValid = await validateKeyManually();
      if (!isValid) {
        console.log("[DEEPGRAM SERVICE] API key validation failed, aborting transcription");
        setTranscriptionError('Please provide a valid API key');
        return;
      }
    }
    
    console.log("[DEEPGRAM SERVICE] Starting transcription process...");
    resetTranscription();
    setIsTranscribing(true);
    
    try {
      console.log(`[DEEPGRAM SERVICE] Transcribing file: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB)`);
      console.log('[DEEPGRAM SERVICE] Using options:', requestOptions);
      
      console.log("[DEEPGRAM SERVICE] Calling transcribeFile function...");
      const response = await transcribeFile(selectedFile, apiKey, requestOptions);
      console.log("[DEEPGRAM SERVICE] Received transcription response:", { 
        status: "success",
        hasResults: Boolean(response?.results),
        requestId: response?.request_id
      });
      
      setRawResponse(response);
      
      // Extract and process the transcription result
      console.log("[DEEPGRAM SERVICE] Extracting transcription result...");
      const result = extractTranscriptionResult(response);
      console.log("[DEEPGRAM SERVICE] Extracted result:", { 
        hasTranscript: Boolean(result?.transcript),
        transcriptLength: result?.transcript?.length || 0,
        confidence: result?.confidence
      });
      
      setTranscription(result);
      setIsProcessingComplete(true);
      console.log('[DEEPGRAM SERVICE] Transcription completed successfully');
    } catch (error: any) {
      console.error('[DEEPGRAM SERVICE] Transcription failed:', error);
      console.log('[DEEPGRAM SERVICE] Error details:', { 
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      setTranscriptionError(error.message || 'Failed to transcribe file');
    } finally {
      setIsTranscribing(false);
    }
  }, [apiKey, isApiKeyValid, requestOptions, selectedFile, validateKeyManually, resetTranscription]);
  
  return {
    apiKey,
    setApiKey,
    isApiKeyValid,
    isValidatingApiKey,
    apiKeyError,
    transcription,
    rawResponse,
    transcriptionError,
    isTranscribing,
    isProcessingComplete,
    selectedFile,
    setSelectedFile,
    requestOptions,
    updateRequestOptions,
    transcribeSelectedFile,
    validateKeyManually,
    resetTranscription,
    clearApiKey
  };
};

export default useDeepgramService;

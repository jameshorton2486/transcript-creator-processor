import { useState, useEffect, useCallback } from 'react';
import { 
  validateApiKey, 
  transcribeFile, 
  extractTranscriptionResult,
  apiKeyStorage
} from '@/lib/deepgram/apiHelpers';
import { TranscriptionResult, DeepgramAPIResponse, DeepgramRequestOptions } from '@/lib/deepgram/types';
import { DEFAULT_OPTIONS } from '@/lib/deepgram/deepgramConfig';

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
  // API key state
  const [apiKey, setApiKeyState] = useState<string>(initialApiKey || apiKeyStorage.get() || '');
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);
  const [isValidatingApiKey, setIsValidatingApiKey] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // File and transcription state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawResponse, setRawResponse] = useState<DeepgramAPIResponse | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isProcessingComplete, setIsProcessingComplete] = useState<boolean>(false);
  
  // Request options
  const [requestOptions, setRequestOptions] = useState<DeepgramRequestOptions>(DEFAULT_OPTIONS);
  
  // Update API key and save to storage
  const setApiKey = useCallback((key: string) => {
    console.log("[DEEPGRAM SERVICE] Setting API key:", { 
      keyLength: key?.length, 
      keyChanged: key !== apiKey 
    });
    setApiKeyState(key);
    apiKeyStorage.save(key);
    
    // Reset validation state when key changes
    setIsApiKeyValid(false);
    setApiKeyError(null);
  }, [apiKey]);
  
  // Clear API key from state and storage
  const clearApiKey = useCallback(() => {
    setApiKeyState('');
    apiKeyStorage.clear();
    setIsApiKeyValid(false);
  }, []);
  
  // Update transcription request options
  const updateRequestOptions = useCallback((options: Partial<DeepgramRequestOptions>) => {
    setRequestOptions(prev => ({
      ...prev,
      ...options
    }));
  }, []);
  
  // Validate API key
  const validateKeyManually = useCallback(async (): Promise<boolean> => {
    if (!apiKey) {
      console.log("[DEEPGRAM SERVICE] No API key provided for validation");
      setApiKeyError('API key is required');
      setIsApiKeyValid(false);
      return false;
    }
    
    console.log("[DEEPGRAM SERVICE] Starting API key validation...");
    setIsValidatingApiKey(true);
    setApiKeyError(null);
    
    try {
      console.log('[DEEPGRAM SERVICE] Calling validateApiKey function...');
      const result = await validateApiKey(apiKey);
      
      console.log('[DEEPGRAM SERVICE] API key validation result:', result);
      setIsApiKeyValid(result.valid);
      
      if (!result.valid) {
        setApiKeyError(result.message || 'Invalid API key');
        console.error('[DEEPGRAM SERVICE] API validation failed:', result.message);
      } else {
        console.log('[DEEPGRAM SERVICE] API key is valid');
      }
      
      return result.valid;
    } catch (error: any) {
      console.error('[DEEPGRAM SERVICE] API validation error:', error);
      setIsApiKeyValid(false);
      setApiKeyError(error.message || 'Failed to validate API key');
      return false;
    } finally {
      setIsValidatingApiKey(false);
    }
  }, [apiKey]);
  
  // Automatically validate API key if enabled and key exists
  useEffect(() => {
    if (apiKey && autoValidateKey && !isApiKeyValid) {
      validateKeyManually();
    }
  }, [apiKey, autoValidateKey, isApiKeyValid, validateKeyManually]);
  
  // Reset transcription state
  const resetTranscription = useCallback(() => {
    setRawResponse(null);
    setTranscription(null);
    setTranscriptionError(null);
    setIsTranscribing(false);
    setIsProcessingComplete(false);
  }, []);
  
  // Transcribe the selected file
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


import { useState, useEffect, useCallback } from 'react';
import { 
  validateApiKey, 
  transcribeFile, 
  extractTranscriptionResult,
  apiKeyStorage,
  DeepgramRequestOptions,
  TranscriptionResult,
  DeepgramTranscriptionResponse
} from '@/lib/deepgram/deepgramService';
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
  rawResponse: DeepgramTranscriptionResponse | null;
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
  const [rawResponse, setRawResponse] = useState<DeepgramTranscriptionResponse | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isProcessingComplete, setIsProcessingComplete] = useState<boolean>(false);
  
  // Request options
  const [requestOptions, setRequestOptions] = useState<DeepgramRequestOptions>(DEFAULT_OPTIONS);
  
  // Update API key and save to storage
  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    apiKeyStorage.save(key);
    
    // Reset validation state when key changes
    setIsApiKeyValid(false);
    setApiKeyError(null);
  }, []);
  
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
      setApiKeyError('API key is required');
      setIsApiKeyValid(false);
      return false;
    }
    
    setIsValidatingApiKey(true);
    setApiKeyError(null);
    
    try {
      console.log('Validating Deepgram API key...');
      const result = await validateApiKey(apiKey);
      
      setIsApiKeyValid(result.valid);
      
      if (!result.valid) {
        setApiKeyError(result.message || 'Invalid API key');
        console.error('API validation failed:', result.message);
      } else {
        console.log('API key is valid');
      }
      
      return result.valid;
    } catch (error: any) {
      console.error('API validation error:', error);
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
      setTranscriptionError('No file selected');
      return;
    }
    
    if (!isApiKeyValid) {
      const isValid = await validateKeyManually();
      if (!isValid) {
        setTranscriptionError('Please provide a valid API key');
        return;
      }
    }
    
    resetTranscription();
    setIsTranscribing(true);
    
    try {
      console.log(`Transcribing file: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB)`);
      console.log('Using options:', requestOptions);
      
      const response = await transcribeFile(selectedFile, apiKey, requestOptions);
      setRawResponse(response);
      
      // Extract and process the transcription result
      const result = extractTranscriptionResult(response);
      setTranscription(result);
      
      setIsProcessingComplete(true);
      console.log('Transcription completed successfully');
    } catch (error: any) {
      console.error('Transcription failed:', error);
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

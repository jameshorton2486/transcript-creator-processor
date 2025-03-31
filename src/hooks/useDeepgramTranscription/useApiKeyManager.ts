
import { useState, useCallback, useEffect } from 'react';
import { validateApiKey, apiKeyStorage } from '@/lib/deepgram/apiHelpers';

interface UseApiKeyManagerProps {
  initialApiKey?: string;
  autoValidateKey?: boolean;
}

interface UseApiKeyManagerReturn {
  apiKey: string;
  setApiKey: (key: string) => void;
  isApiKeyValid: boolean;
  isValidatingApiKey: boolean;
  apiKeyError: string | null;
  validateKeyManually: () => Promise<boolean>;
  clearApiKey: () => void;
}

/**
 * Hook for managing Deepgram API key
 */
export const useApiKeyManager = ({
  initialApiKey = '',
  autoValidateKey = true
}: UseApiKeyManagerProps): UseApiKeyManagerReturn => {
  // API key state
  const [apiKey, setApiKeyState] = useState<string>(initialApiKey || apiKeyStorage.get() || '');
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);
  const [isValidatingApiKey, setIsValidatingApiKey] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Update API key and save to storage
  const setApiKey = useCallback((key: string) => {
    console.log("[API KEY MANAGER] Setting API key:", { 
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
  
  // Validate API key
  const validateKeyManually = useCallback(async (): Promise<boolean> => {
    if (!apiKey) {
      console.log("[API KEY MANAGER] No API key provided for validation");
      setApiKeyError('API key is required');
      setIsApiKeyValid(false);
      return false;
    }
    
    console.log("[API KEY MANAGER] Starting API key validation...");
    setIsValidatingApiKey(true);
    setApiKeyError(null);
    
    try {
      console.log('[API KEY MANAGER] Calling validateApiKey function...');
      const result = await validateApiKey(apiKey);
      
      console.log('[API KEY MANAGER] API key validation result:', result);
      setIsApiKeyValid(result.valid);
      
      if (!result.valid) {
        setApiKeyError(result.message || 'Invalid API key');
        console.error('[API KEY MANAGER] API validation failed:', result.message);
      } else {
        console.log('[API KEY MANAGER] API key is valid');
      }
      
      return result.valid;
    } catch (error: any) {
      console.error('[API KEY MANAGER] API validation error:', error);
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

  return {
    apiKey,
    setApiKey,
    isApiKeyValid,
    isValidatingApiKey,
    apiKeyError,
    validateKeyManually,
    clearApiKey
  };
};


import { useState, useEffect, useCallback } from 'react';
import { validateApiKey, getSavedApiKey, saveApiKey } from '@/lib/deepgram/authService';
import { ToastProps } from "@/components/ui/toast";

interface UseTranscriptionKeyManagementProps {
  initialApiKey?: string;
  autoValidateKey?: boolean;
  toast: {
    toast: (props: { title: string; description: string; variant?: "default" | "destructive" }) => void;
  };
}

interface UseTranscriptionKeyManagementReturn {
  apiKey: string;
  setApiKey: (key: string) => void;
  isApiKeyValid: boolean;
  isValidatingApiKey: boolean;
  apiKeyError: string | null;
  validateKey: () => Promise<boolean>;
}

/**
 * Hook for managing Deepgram API key validation
 */
export const useTranscriptionKeyManagement = ({
  initialApiKey = '',
  autoValidateKey = true,
  toast
}: UseTranscriptionKeyManagementProps): UseTranscriptionKeyManagementReturn => {
  // API key state
  const [apiKey, setApiKeyState] = useState<string>(initialApiKey || getSavedApiKey() || '');
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);
  const [isValidatingApiKey, setIsValidatingApiKey] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Set API key and save to localStorage
  const setApiKey = useCallback((key: string) => {
    console.log("[KEY MANAGEMENT] Setting new API key, length:", key?.length);
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
      toast.toast({
        title: "API Key Required",
        description: "Please enter a Deepgram API key",
        variant: "destructive"
      });
      return false;
    }

    setIsValidatingApiKey(true);
    setApiKeyError(null);

    try {
      console.log('[KEY MANAGEMENT] Testing API key validity...');
      const result = await validateApiKey(apiKey);
      console.log('[KEY MANAGEMENT] Validation result:', result);
      
      setIsApiKeyValid(result.valid);
      
      if (!result.valid) {
        setApiKeyError(result.message || 'Invalid API key');
        console.error('[KEY MANAGEMENT] API validation failed:', result.message);
        toast.toast({
          title: "API Key Invalid",
          description: result.message || "Invalid API key",
          variant: "destructive"
        });
      } else {
        toast.toast({
          title: "API Key Valid",
          description: "Your Deepgram API key is valid"
        });
      }
      
      return result.valid;
    } catch (error) {
      console.error('[KEY MANAGEMENT] API validation failed due to error:', error);
      setIsApiKeyValid(false);
      const errorMessage = 'Failed to validate API key. Please check your network connection.';
      setApiKeyError(errorMessage);
      toast.toast({
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
    if (apiKey && autoValidateKey && !isApiKeyValid) {
      console.log('[KEY MANAGEMENT] Auto-validating API key...');
      validateKey();
    }
  }, [apiKey, autoValidateKey, isApiKeyValid, validateKey]);

  return {
    apiKey,
    setApiKey,
    isApiKeyValid,
    isValidatingApiKey,
    apiKeyError,
    validateKey
  };
};

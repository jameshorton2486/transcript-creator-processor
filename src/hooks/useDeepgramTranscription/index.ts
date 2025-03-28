
/**
 * React hook for managing audio transcription with Deepgram API
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { transcribeAudioFile, testApiKey } from '../../lib/deepgram/transcriber';
import { retrieveStoredApiKey, storeApiKey } from '../../lib/deepgram/auth';
import {
  DeepgramTranscriptionOptions,
  DeepgramTranscriptionHookState,
  UseDeepgramTranscriptionReturn,
} from './types';

export function useDeepgramTranscription(): UseDeepgramTranscriptionReturn {
  const [state, setState] = useState<DeepgramTranscriptionHookState>({
    file: null,
    isLoading: false,
    error: null,
    progress: 0,
    apiKey: '',
    keyStatus: 'untested',
    testingKey: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const optionsRef = useRef<DeepgramTranscriptionOptions>({});

  useEffect(() => {
    const storedKey = retrieveStoredApiKey();
    if (storedKey) {
      setState(prev => ({ ...prev, apiKey: storedKey }));
      handleTestApiKey(storedKey);
    }
  }, []);

  const setApiKey = useCallback((key: string) => {
    setState(prev => ({ ...prev, apiKey: key }));
  }, []);

  const setOptions = useCallback((options: Partial<DeepgramTranscriptionOptions>) => {
    optionsRef.current = { ...optionsRef.current, ...options };
  }, []);

  const handleFileSelected = useCallback((file: File) => {
    setState(prev => ({ ...prev, file, error: null, progress: 0 }));
  }, []);

  const handleTestApiKey = useCallback(async (keyToTest?: string): Promise<boolean> => {
    const key = keyToTest || state.apiKey;

    if (!key.trim()) {
      setState(prev => ({ ...prev, keyStatus: 'invalid', keyErrorMessage: 'API key is required' }));
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

      if (result.isValid) storeApiKey(key);
      return result.isValid;
    } catch (error) {
      setState(prev => ({
        ...prev,
        keyStatus: 'invalid',
        keyErrorMessage: error instanceof Error ? error.message : 'Unknown error validating API key',
        testingKey: false,
      }));
      return false;
    }
  }, [state.apiKey]);

  const transcribe = useCallback(async (): Promise<void> => {
    if (!state.file) {
      setState(prev => ({ ...prev, error: 'No file selected' }));
      return;
    }

    if (!state.apiKey) {
      setState(prev => ({ ...prev, error: 'API key is required' }));
      return;
    }

    if (state.keyStatus !== 'valid') {
      const isValid = await handleTestApiKey();
      if (!isValid) return;
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, isLoading: true, error: null, progress: 0 }));

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

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        progress: 100,
        result
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error during transcription',
        progress: 0,
      }));
    } finally {
      abortControllerRef.current = null;
    }
  }, [state.file, state.apiKey, state.keyStatus, handleTestApiKey]);

  const cancelTranscription = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    setState(prev => ({ ...prev, isLoading: false, error: 'Transcription cancelled', progress: 0 }));
  }, []);

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

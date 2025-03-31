
import { useState, useCallback } from 'react';
import { validateApiKey, getSavedApiKey, saveApiKey } from '@/lib/deepgram/authService';
import { useToast } from "@/hooks/use-toast";
import { useTranscriptionKeyManagement } from './useTranscriptionKeyManagement';
import { useTranscriptionJobManager } from './useTranscriptionJobManager';

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

// Importing this from another file to avoid circular references
import { TranscriptionResult } from '@/lib/audio/transcriptionService';

/**
 * Custom hook for handling Deepgram transcription
 */
export const useDeepgramTranscriptionService = ({
  initialApiKey = '',
  autoValidateKey = true,
}: UseDeepgramTranscriptionServiceProps = {}): UseDeepgramTranscriptionServiceReturn => {
  const { toast } = useToast();
  
  // Use the key management hook
  const {
    apiKey,
    setApiKey,
    isApiKeyValid,
    isValidatingApiKey,
    apiKeyError,
    validateKey
  } = useTranscriptionKeyManagement({
    initialApiKey,
    autoValidateKey,
    toast
  });

  // Use the job manager hook
  const {
    transcriptionResult,
    transcriptionError,
    isTranscribing,
    transcriptionProgress,
    transcribeFile,
    resetTranscription
  } = useTranscriptionJobManager({
    apiKey,
    isApiKeyValid,
    validateKey,
    toast
  });

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

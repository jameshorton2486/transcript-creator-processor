
import { useState, useCallback } from 'react';
import {
  uploadFileForTranscription,
  checkTranscriptionStatus,
  getTranscriptionResult,
  TranscriptionResult
} from '@/lib/audio/transcriptionService';
import { ToastProps } from "@/components/ui/toast";

export interface TranscriptionOptions {
  language?: string;
  punctuate?: boolean;
  diarize?: boolean;
  model?: string;
}

interface UseTranscriptionJobManagerProps {
  apiKey: string;
  isApiKeyValid: boolean;
  validateKey: () => Promise<boolean>;
  toast: {
    toast: (props: { title: string; description: string; variant?: "default" | "destructive" }) => void;
  };
}

interface UseTranscriptionJobManagerReturn {
  transcriptionResult: TranscriptionResult | null;
  transcriptionError: string | null;
  isTranscribing: boolean;
  transcriptionProgress: number;
  transcribeFile: (file: File, options?: TranscriptionOptions) => Promise<void>;
  resetTranscription: () => void;
}

/**
 * Hook for managing transcription jobs
 */
export const useTranscriptionJobManager = ({
  apiKey,
  isApiKeyValid,
  validateKey,
  toast
}: UseTranscriptionJobManagerProps): UseTranscriptionJobManagerReturn => {
  // Transcription state
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<number>(0);
  const [jobId, setJobId] = useState<string | null>(null);

  // Reset transcription state
  const resetTranscription = useCallback(() => {
    console.log('[JOB MANAGER] Resetting transcription state');
    setTranscriptionResult(null);
    setTranscriptionError(null);
    setIsTranscribing(false);
    setTranscriptionProgress(0);
    setJobId(null);
  }, []);

  // Transcribe file
  const transcribeFile = useCallback(async (file: File, options?: TranscriptionOptions): Promise<void> => {
    console.log('[JOB MANAGER] Starting transcription for file:', file.name);
    if (!isApiKeyValid) {
      console.log('[JOB MANAGER] API key not valid, attempting validation');
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
      toast.toast({
        title: "Transcription Started",
        description: `Processing ${file.name}`
      });
      
      // Upload file for transcription
      console.log('[JOB MANAGER] Uploading file for transcription');
      const { id } = await uploadFileForTranscription(file, apiKey, options);
      console.log('[JOB MANAGER] Received job ID:', id);
      setJobId(id);

      // Poll for status and update progress
      console.log('[JOB MANAGER] Setting up status polling');
      const statusCheckInterval = setInterval(async () => {
        try {
          const status = await checkTranscriptionStatus(id, apiKey);
          console.log('[JOB MANAGER] Status update:', status);
          
          setTranscriptionProgress(status.progress || 0);
          
          if (status.status === 'completed') {
            console.log('[JOB MANAGER] Transcription completed, fetching result');
            clearInterval(statusCheckInterval);
            const result = await getTranscriptionResult(id, apiKey);
            setTranscriptionResult(result);
            setIsTranscribing(false);
            
            toast.toast({
              title: "Transcription Complete",
              description: "Your audio has been successfully transcribed"
            });
          } else if (status.status === 'failed') {
            console.error('[JOB MANAGER] Transcription failed:', status.error);
            clearInterval(statusCheckInterval);
            setTranscriptionError(status.error || 'Transcription failed');
            setIsTranscribing(false);
            
            toast.toast({
              title: "Transcription Failed",
              description: status.error || "Failed to transcribe audio",
              variant: "destructive"
            });
          }
        } catch (err) {
          console.error('[JOB MANAGER] Error checking transcription status:', err);
        }
      }, 2000);
    } catch (error: any) {
      console.error('[JOB MANAGER] Transcription error:', error);
      const errorMessage = error.message || 'Failed to transcribe file';
      setTranscriptionError(errorMessage);
      setIsTranscribing(false);
      
      toast.toast({
        title: "Transcription Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [apiKey, isApiKeyValid, validateKey, toast]);

  return {
    transcriptionResult,
    transcriptionError,
    isTranscribing,
    transcriptionProgress,
    transcribeFile,
    resetTranscription
  };
};

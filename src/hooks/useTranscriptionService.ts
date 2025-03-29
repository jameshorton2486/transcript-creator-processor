
import { useState, useCallback } from 'react';
import { 
  transcribeAudioFile, 
  TranscriptionResult 
} from '@/lib/audio/transcriptionService';
import { useToast } from "@/hooks/use-toast";

interface UseTranscriptionServiceProps {
  apiKey?: string;
  onComplete?: (result: TranscriptionResult) => void;
}

interface UseTranscriptionServiceReturn {
  transcribe: (file: File, options?: any) => Promise<TranscriptionResult | undefined>;
  isTranscribing: boolean;
  progress: number;
  result: TranscriptionResult | null;
  error: string | null;
  setApiKey: (key: string) => void;
  cancel: () => void;
}

export function useTranscriptionService({
  apiKey: initialApiKey = '',
  onComplete
}: UseTranscriptionServiceProps = {}): UseTranscriptionServiceReturn {
  const [apiKey, setApiKey] = useState<string>(initialApiKey);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const { toast } = useToast();

  const cancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsTranscribing(false);
      setProgress(0);
      toast({
        title: "Transcription Cancelled",
        description: "The transcription process has been cancelled."
      });
    }
  }, [abortController, toast]);

  const transcribe = useCallback(async (
    file: File,
    options?: {
      language?: string;
      punctuate?: boolean;
      diarize?: boolean;
    }
  ): Promise<TranscriptionResult | undefined> => {
    if (!file) {
      setError('No file provided');
      toast({
        title: "Error",
        description: "No file was provided for transcription.",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey) {
      setError('API key is required');
      toast({
        title: "Error",
        description: "API key is required for transcription.",
        variant: "destructive"
      });
      return;
    }

    // Reset state
    setError(null);
    setProgress(0);
    setResult(null);
    setIsTranscribing(true);

    // Create abort controller
    const controller = new AbortController();
    setAbortController(controller);

    try {
      toast({
        title: "Transcription Started",
        description: "Your file is being processed. This may take a few moments."
      });

      const transcriptionResult = await transcribeAudioFile(
        file,
        apiKey,
        {
          ...options,
          onProgress: (p) => setProgress(p),
          pollingInterval: 1500, // 1.5 seconds
          maxAttempts: 40, // ~60 seconds total
        }
      );

      // Check if aborted
      if (controller.signal.aborted) {
        return;
      }

      setResult(transcriptionResult);
      setIsTranscribing(false);
      setProgress(100);

      if (transcriptionResult.error) {
        setError(transcriptionResult.error);
        toast({
          title: "Transcription Error",
          description: transcriptionResult.error,
          variant: "destructive"
        });
      } else if (!transcriptionResult.transcript || transcriptionResult.transcript.trim() === '') {
        setError('No speech detected in the audio file');
        toast({
          title: "No Speech Detected",
          description: "No recognizable speech was found in the audio file.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Transcription Complete",
          description: "Your audio has been successfully transcribed."
        });
        
        if (onComplete) {
          onComplete(transcriptionResult);
        }
      }

      return transcriptionResult;
    } catch (err) {
      // Only set error if not aborted
      if (!controller.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        setIsTranscribing(false);
        
        toast({
          title: "Transcription Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setAbortController(null);
    }
  }, [apiKey, toast, onComplete]);

  return {
    transcribe,
    isTranscribing,
    progress,
    result,
    error,
    setApiKey,
    cancel
  };
}

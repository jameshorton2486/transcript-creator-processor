
import { useCallback, useState } from 'react';
import { useDeepgramTranscription } from './useDeepgramTranscription';
import { useToast } from './use-toast';

export const useTranscriptionService = () => {
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { transcribeAudioFile } = useDeepgramTranscription();
  const { toast } = useToast();

  const handleTranscribe = useCallback(async (file: File) => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select an audio file to transcribe',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await transcribeAudioFile(file);
      if (result?.transcript) {
        setTranscription(result.transcript);
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(error instanceof Error ? error : new Error(errorMessage));
      toast({
        title: 'Transcription Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [transcribeAudioFile, toast]);

  return {
    transcription,
    isProcessing,
    error,
    handleTranscribe,
  };
};

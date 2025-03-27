
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { transcribeAudio, getAvailableModels, WHISPER_MODELS } from "@/lib/whisper";
import { getModelStatus } from "@/lib/whisper/core/modelLoader";

export const useWhisperTranscription = (
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void
) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState(WHISPER_MODELS.tiny);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  
  // Get available models
  const availableModels = Object.values(WHISPER_MODELS);

  // Poll for model status during loading
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (modelLoading) {
      intervalId = window.setInterval(() => {
        const status = getModelStatus();
        if (status === 'loaded') {
          setModelLoading(false);
          setModelLoadProgress(100);
          clearInterval(intervalId!);
        } else if (status === 'failed') {
          setModelLoading(false);
          setError('Failed to load Whisper model. Please try again or select a different model.');
          clearInterval(intervalId!);
        }
      }, 1000);
    }
    
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [modelLoading]);

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setProgress(0);
  };

  const selectModel = (model: string) => {
    setSelectedModel(model);
  };

  const cancelTranscription = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsLoading(false);
    setModelLoading(false);
    setProgress(0);
    setModelLoadProgress(0);
    
    toast({
      title: "Transcription cancelled",
      description: "The transcription process was cancelled.",
    });
  };

  const transcribeAudioFile = async () => {
    if (!file) {
      setError("Please select an audio file first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    // Create a new AbortController for this transcription
    abortControllerRef.current = new AbortController();
    
    try {
      // Track model loading progress separately
      const handleProgress = (currentProgress: number) => {
        // If progress is less than 50%, it's likely the model loading
        if (currentProgress < 50) {
          setModelLoading(true);
          setModelLoadProgress(currentProgress * 2); // Scale to 0-100
        } else {
          setModelLoading(false);
          setProgress(currentProgress);
        }
      };
      
      const result = await transcribeAudio(file, {
        model: selectedModel,
        language: 'en',
        onProgress: handleProgress,
        abortSignal: abortControllerRef.current.signal
      });
      
      onTranscriptCreated(result.text, result, file);
      
      toast({
        title: "Transcription complete",
        description: "Your audio has been successfully transcribed.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Don't show error for cancelled transcriptions
      if (errorMessage.includes('cancel') || errorMessage.includes('abort')) {
        console.log('Transcription was cancelled');
      } else {
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Transcription failed",
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
      setProgress(0);
      setModelLoading(false);
      setModelLoadProgress(0);
      abortControllerRef.current = null;
    }
  };

  return {
    file,
    isLoading,
    error,
    progress,
    modelLoading,
    modelLoadProgress,
    availableModels,
    selectedModel,
    handleFileSelected,
    transcribeAudioFile,
    selectModel,
    cancelTranscription
  };
};

import React, { useState, useCallback, useRef } from 'react';
import { transcribeAudio, preloadWhisperModel } from '@/lib/whisper';
import { toast } from "@/hooks/use-toast";

export const useWhisperTranscription = (onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState('tiny');
  const [availableModels] = useState(['tiny', 'base', 'small', 'medium', 'large']);
  
  const abortController = useRef<AbortController | null>(null);

  // Function to handle file selection
  const handleFileSelected = (newFile: File | null) => {
    setFile(newFile);
    setError(null);
    setProgress(0);
  };

  // Function to handle model selection
  const selectModel = (model: string) => {
    setSelectedModel(model);
  };

  // Function to cancel ongoing transcription
  const cancelTranscription = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
      setIsLoading(false);
      toast({
        title: "Transcription Cancelled",
        description: "The transcription process has been cancelled.",
      });
    }
  };

  // Function to transcribe audio file
  const transcribeAudioFile = useCallback(async () => {
    if (!file) {
      setError("Please select a file to transcribe");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setProgress(0);
      
      abortController.current = new AbortController();
      
      // Preload the model first
      setModelLoading(true);
      
      await preloadWhisperModel(selectedModel, (progress: number) => {
        setModelLoadProgress(Math.min(progress, 100));
      });
      
      setModelLoading(false);
      
      // Then transcribe the audio
      const result = await transcribeAudio(file, selectedModel, (progress: number) => {
        setProgress(Math.min(progress, 100));
      }, abortController.current.signal);
      
      // Process the transcription result
      if (result && result.text) {
        onTranscriptCreated(result.text, result, file);
        toast({
          title: "Transcription Complete",
          description: "Your audio has been successfully transcribed.",
        });
      } else {
        throw new Error("Failed to generate transcript");
      }
    } catch (err) {
      // Don't show errors for aborted transcriptions
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Transcription Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      abortController.current = null;
    }
  }, [file, selectedModel, onTranscriptCreated]);

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

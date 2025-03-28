
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";

// This hook is kept as a stub to prevent import errors
// The Whisper functionality has been replaced by AssemblyAI
export const useWhisperTranscription = (
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void
) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [selectedModel] = useState({ id: 'base', name: 'Base', size: '142MB' });
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  
  // Empty models array since Whisper is removed
  const availableModels = [];

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setProgress(0);
  };

  const selectModel = () => {
    // No-op function
    console.warn('Whisper functionality has been removed. Using AssemblyAI instead.');
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
    
    try {
      // Simply show an error since Whisper is no longer supported
      setError("Whisper functionality has been removed. Please use AssemblyAI for transcription.");
      
      toast({
        variant: "destructive",
        title: "Transcription method deprecated",
        description: "Whisper transcription has been removed. Please use AssemblyAI instead.",
      });
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

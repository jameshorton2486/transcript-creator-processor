
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { TranscriptionHookState, UseTranscriptionReturn } from "./types";
import { DEFAULT_TRANSCRIPTION_OPTIONS } from "@/lib/config";

export const useTranscription = (onTranscriptCreated: (transcript: string, jsonData: any) => void): UseTranscriptionReturn => {
  const [state, setState] = useState<TranscriptionHookState>({
    file: null,
    isLoading: false,
    error: null,
    progress: 0,
    isBatchProcessing: false,
    apiKey: "",
    documentFiles: [],
  });
  
  const [options, setOptions] = useState({
    punctuate: true,
    speakerLabels: true,
    formatText: true,
    model: 'default'
  });
  
  const [customTerms, setCustomTerms] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileSelected = (selectedFile: File) => {
    setState(prev => ({
      ...prev,
      file: selectedFile,
      error: null,
      isBatchProcessing: false
    }));
    
    // Log file info for diagnostics
    console.log(`File selected: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
  };

  const handleDocumentFilesChange = (files: File[]) => {
    if (files && files.length > 0) {
      setState(prev => ({ ...prev, documentFiles: files }));
    }
  };

  const transcribeAudioFile = async () => {
    toast({
      title: "Using AssemblyAI",
      description: "Please use the AssemblyAI transcriber section for transcription.",
    });
  };

  const setApiKey = (apiKey: string) => {
    setState(prev => ({ ...prev, apiKey }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const updateOptions = (newOptions: any) => {
    setOptions(current => ({
      ...current,
      ...newOptions,
    }));
  };

  return {
    ...state,
    options,
    customTerms,
    handleFileSelected,
    transcribeAudioFile,
    setOptions: updateOptions,
    setApiKey,
    setError,
    setCustomTerms,
    handleDocumentFilesChange
  };
};

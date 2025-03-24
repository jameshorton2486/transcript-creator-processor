
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_TRANSCRIPTION_OPTIONS, TranscriptionOptions } from "@/lib/config";
import { TranscriptionHookState, UseTranscriptionReturn } from "./types";
import { performTranscription } from "./transcription";

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
  
  const [options, setOptions] = useState(DEFAULT_TRANSCRIPTION_OPTIONS);
  const [customTerms, setCustomTerms] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileSelected = (selectedFile: File) => {
    setState(prev => ({
      ...prev,
      file: selectedFile,
      error: null,
      isBatchProcessing: selectedFile.size > 200 * 1024 * 1024 // 200MB
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
    const { file, apiKey } = state;
    
    await performTranscription(
      file,
      apiKey,
      options,
      customTerms,
      (progress) => setState(prev => ({ ...prev, progress })),
      (isLoading) => setState(prev => ({ ...prev, isLoading })),
      (isBatchProcessing) => setState(prev => ({ ...prev, isBatchProcessing })),
      (error) => setState(prev => ({ ...prev, error })),
      onTranscriptCreated,
      toast
    );
  };

  const setApiKey = (apiKey: string) => {
    setState(prev => ({ ...prev, apiKey }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  return {
    ...state,
    options,
    customTerms,
    handleFileSelected,
    transcribeAudioFile,
    setOptions,
    setApiKey,
    setError,
    setCustomTerms,
    handleDocumentFilesChange
  };
};

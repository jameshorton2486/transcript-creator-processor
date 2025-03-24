
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  AssemblyAITranscriptionHookState, 
  AssemblyAITranscriptionOptions
} from "./types";
import { storeKey, getKey, clearKey } from "@/lib/assemblyai/auth";
import { transcribeAudio, testApiKey } from '@/lib/assemblyai';
import { safePromise } from '@/hooks/useTranscription/promiseUtils';

const initialState: AssemblyAITranscriptionHookState = {
  file: null,
  isLoading: false,
  error: null,
  progress: 0,
  apiKey: "",
  transcriptionResult: null,
  isConfigured: false,
  language: 'en',
  speakerLabels: false,
  punctuate: true,
  formatText: true,
};

export const useAssemblyAITranscription = () => {
  const [state, setState] = useState<AssemblyAITranscriptionHookState>(initialState);
  const { toast } = useToast();

  // Load API key from local storage on component mount
  useState(() => {
    const storedKey = getKey();
    if (storedKey) {
      setState(prevState => ({ ...prevState, apiKey: storedKey, isConfigured: true }));
    }
  });

  const setApiKey = (apiKey: string) => {
    setState(prevState => ({ ...prevState, apiKey }));
  };

  const configure = async (apiKey: string) => {
    try {
      // Validate API Key
      const isValid = await safePromise(testApiKey(apiKey));
      if (!isValid) {
        throw new Error('Invalid API key provided.');
      }

      // Store API key in local storage
      storeKey(apiKey);

      setState(prevState => ({
        ...prevState,
        apiKey: apiKey,
        isConfigured: true,
        error: null,
      }));

      toast({
        title: "Configuration successful",
        description: "Your API key has been successfully configured.",
      });
    } catch (error: any) {
      console.error("Configuration error:", error);
      clearKey();
      setState(prevState => ({
        ...prevState,
        isConfigured: false,
        error: error.message || 'Failed to configure API key.',
      }));
      toast({
        title: "Configuration failed",
        description: error.message || "Failed to configure API key.",
        variant: "destructive",
      });
    }
  };

  const clearConfiguration = () => {
    clearKey();
    setState(prevState => ({
      ...prevState,
      apiKey: "",
      isConfigured: false,
      error: null,
    }));
    toast({
      description: "API key cleared. Please configure again to use the service.",
    });
  };

  const handleFileSelected = (file: File) => {
    setState(prevState => ({
      ...prevState,
      file: file,
      error: null,
    }));
  };

  const setError = (error: string | null) => {
    setState(prevState => ({ ...prevState, error }));
  };

  const setOptions = (options: Partial<AssemblyAITranscriptionOptions>) => {
      setState(prevState => ({
          ...prevState,
          language: options.language || prevState.language,
          speakerLabels: options.speakerLabels ?? prevState.speakerLabels,
          punctuate: options.punctuate ?? prevState.punctuate,
          formatText: options.formatText ?? prevState.formatText,
      }));
  };

  const transcribe = async () => {
    if (!state.file) {
      setError("Please select a file to transcribe.");
      toast({
        title: "No file selected",
        description: "Please select an audio file first.",
        variant: "destructive",
      });
      return;
    }

    if (!state.apiKey) {
      setError("API key is required. Please configure the API key.");
      toast({
        title: "API Key Required",
        description: "Please configure your API key first.",
        variant: "destructive",
      });
      return;
    }

    setState(prevState => ({ ...prevState, isLoading: true, error: null, progress: 0 }));

    try {
      const result = await transcribeAudio(
        state.file,
        state.apiKey,
        {
          language: state.language,
          speakerLabels: state.speakerLabels,
          punctuate: state.punctuate,
          formatText: state.formatText,
          onProgress: (progress: number) => setState(prevState => ({ ...prevState, progress })),
        }
      );

      setState(prevState => ({
        ...prevState,
        isLoading: false,
        transcriptionResult: result,
        error: null,
      }));

      toast({
        title: "Transcription complete",
        description: "The audio has been successfully transcribed.",
      });
    } catch (error: any) {
      console.error("Transcription error:", error);
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        error: error.message || "Failed to transcribe audio.",
      }));
      toast({
        title: "Transcription failed",
        description: error.message || "Failed to transcribe audio.",
        variant: "destructive",
      });
    } finally {
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };

  return {
    ...state,
    setApiKey,
    configure,
    clearConfiguration,
    handleFileSelected,
    transcribe,
    setError,
    setOptions,
  };
};

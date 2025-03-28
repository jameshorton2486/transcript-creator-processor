import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  AssemblyAITranscriptionHookState, 
  AssemblyAITranscriptionOptions,
  UseAssemblyAITranscriptionReturn
} from "./types";
import { storeKey, getKey, clearKey, verifyApiKey } from "./keyManagement";
import { transcribeAudio } from '@/lib/assemblyai/transcriber';
import { safePromise } from '@/hooks/useTranscription/promiseUtils';

const initialState: AssemblyAITranscriptionHookState = {
  file: null,
  isLoading: false,
  error: null,
  progress: 0,
  apiKey: "",
  keyStatus: "untested",
  testingKey: false
};

export const useAssemblyAITranscription = (onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void): UseAssemblyAITranscriptionReturn => {
  const [state, setState] = useState<AssemblyAITranscriptionHookState>(initialState);
  const [options, setTranscriptionOptions] = useState<AssemblyAITranscriptionOptions>({
    language: 'en',
    speakerLabels: false,
    punctuate: true,
    formatText: true,
  });
  const { toast } = useToast();
  
  // Load API key from local storage on component mount
  useEffect(() => {
    const storedKey = getKey();
    if (storedKey) {
      setState(prevState => ({ 
        ...prevState, 
        apiKey: storedKey, 
        keyStatus: "untested" 
      }));
    }
  }, []);

  const setApiKey = (apiKey: string) => {
    setState(prevState => ({ ...prevState, apiKey }));
  };

  const handleTestApiKey = async () => {
    await verifyApiKey(state.apiKey, setState, { toast });
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

  const setOptions = (newOptions: Partial<AssemblyAITranscriptionOptions>) => {
    setTranscriptionOptions(prev => ({
      ...prev,
      ...newOptions
    }));
  };

  const transcribeAudioFile = async () => {
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
      setError("API key is required. Please enter your API key.");
      toast({
        title: "API Key Required",
        description: "Please enter your AssemblyAI API key.",
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
          language: options.language,
          speakerLabels: options.speakerLabels,
          punctuate: options.punctuate,
          formatText: options.formatText,
          onProgress: (progress: number) => setState(prevState => ({ ...prevState, progress })),
        }
      );

      setState(prevState => ({
        ...prevState,
        isLoading: false,
        error: null,
      }));

      // Call the callback with the transcript text and full result data
      onTranscriptCreated(result.text, result, state.file);

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
    }
  };

  const cancelTranscription = () => {
    setState(prevState => ({ 
      ...prevState, 
      isLoading: false, 
      progress: 0 
    }));
    
    toast({
      title: "Transcription cancelled",
      description: "The transcription process has been cancelled.",
    });
  };

  return {
    ...state,
    handleFileSelected,
    transcribeAudioFile,
    setApiKey,
    cancelTranscription,
    handleTestApiKey,
    setOptions
  };
};

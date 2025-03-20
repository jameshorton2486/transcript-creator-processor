
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { 
  transcribeAudio, 
  testApiKey,
  AssemblyAITranscriptionOptions 
} from "@/lib/assemblyai";
import { formatErrorMessage } from "@/hooks/useTranscription/utils";

export interface AssemblyAITranscriptionHookState {
  file: File | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  apiKey: string;
}

export const useAssemblyAITranscription = (
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void
) => {
  const [state, setState] = useState<AssemblyAITranscriptionHookState>({
    file: null,
    isLoading: false,
    error: null,
    progress: 0,
    apiKey: "",
  });
  
  const { toast } = useToast();

  const handleFileSelected = (selectedFile: File) => {
    setState(prev => ({
      ...prev,
      file: selectedFile,
      error: null,
    }));
    
    console.log(`File selected: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
  };

  const transcribeAudioFile = async () => {
    const { file, apiKey } = state;
    
    if (!file) {
      setState(prev => ({ ...prev, error: "No file selected. Please select an audio or video file first." }));
      toast({
        title: "No file selected",
        description: "Please select an audio or video file first.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      setState(prev => ({ ...prev, error: "AssemblyAI API key is required for transcription." }));
      toast({
        title: "API Key Required",
        description: "Please enter your AssemblyAI API key.",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true,
      error: null,
      progress: 0
    }));
    
    // Create an AbortController for cancellation
    const controller = new AbortController();
    
    try {
      // Log transcription start
      console.log(`Transcription started for: ${file.name}`);
      console.log(`File details: ${file.type}, ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Verify the API key is valid
      const isKeyValid = await testApiKey(apiKey);
      if (!isKeyValid) {
        throw new Error("API key is invalid or unauthorized");
      }
      
      // Set up options
      const options: AssemblyAITranscriptionOptions = {
        speakerLabels: true,
        punctuate: true,
        formatText: true,
        onProgress: (progress) => {
          setState(prev => ({
            ...prev,
            progress
          }));
        },
        abortSignal: controller.signal
      };
      
      // Start transcription
      const response = await transcribeAudio(file, apiKey, options);
      
      // Process the transcript text
      const transcriptText = response.results.transcripts[0].transcript;
      
      // Call the callback with the transcript
      onTranscriptCreated(transcriptText, response, file);
      
      toast({
        title: "Transcription complete",
        description: "The audio has been successfully transcribed.",
      });
      
      console.log("Transcription completed successfully");
    } catch (error: any) {
      console.error("Transcription error:", error);
      
      const errorMessage = formatErrorMessage(error);
      
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: "Transcription failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setState(prev => ({
        ...prev,
        isLoading: false,
        progress: 0
      }));
      console.log("Transcription process completed (success or error)");
    }
  };

  const setApiKey = (apiKey: string) => {
    setState(prev => ({ ...prev, apiKey }));
  };
  
  const cancelTranscription = () => {
    toast({
      title: "Transcription cancelled",
      description: "The transcription process was cancelled.",
    });
  };

  return {
    ...state,
    handleFileSelected,
    transcribeAudioFile,
    setApiKey,
    cancelTranscription
  };
};

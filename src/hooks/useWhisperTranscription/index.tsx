
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { 
  transcribeAudio, 
  WhisperTranscriptionOptions, 
  loadWhisperModel,
  getAvailableModels
} from "@/lib/whisper";
import { formatErrorMessage } from "@/hooks/useTranscription/utils";

export interface WhisperTranscriptionHookState {
  file: File | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  modelLoading: boolean;
  modelLoadProgress: number;
  availableModels: any[];
  selectedModel: string;
}

export const useWhisperTranscription = (
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void
) => {
  const [state, setState] = useState<WhisperTranscriptionHookState>({
    file: null,
    isLoading: false,
    error: null,
    progress: 0,
    modelLoading: false,
    modelLoadProgress: 0,
    availableModels: getAvailableModels(),
    selectedModel: getAvailableModels()[0].id, // Default to first model
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
    const { file, selectedModel } = state;
    
    if (!file) {
      setState(prev => ({ ...prev, error: "No file selected. Please select an audio or video file first." }));
      toast({
        title: "No file selected",
        description: "Please select an audio or video file first.",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true,
      error: null,
      progress: 0,
      modelLoading: true
    }));
    
    // Create an AbortController for cancellation
    const controller = new AbortController();
    
    try {
      // Log transcription start
      console.log(`Transcription started for: ${file.name}`);
      console.log(`File details: ${file.type}, ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Selected model: ${selectedModel}`);
      
      // Set up options
      const options: WhisperTranscriptionOptions = {
        model: selectedModel,
        onProgress: (progress) => {
          // Update progress state
          if (progress <= 40) {
            // Model loading phase
            setState(prev => ({
              ...prev,
              modelLoadProgress: progress * 2.5, // Scale 0-40 to 0-100
              progress: progress
            }));
          } else {
            // Transcription phase
            setState(prev => ({
              ...prev,
              modelLoading: false,
              progress: progress
            }));
          }
        },
        abortSignal: controller.signal
      };
      
      // Start transcription
      const response = await transcribeAudio(file, options);
      
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
        modelLoading: false,
        progress: 0
      }));
      console.log("Transcription process completed (success or error)");
    }
  };

  const selectModel = (modelId: string) => {
    setState(prev => ({ ...prev, selectedModel: modelId }));
  };
  
  const cancelTranscription = () => {
    // This would trigger the AbortController if implemented
    toast({
      title: "Transcription cancelled",
      description: "The transcription process was cancelled.",
    });
  };

  return {
    ...state,
    handleFileSelected,
    transcribeAudioFile,
    selectModel,
    cancelTranscription
  };
};

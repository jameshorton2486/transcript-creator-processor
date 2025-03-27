
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  transcribeAudio, 
  getAvailableModels, 
  WHISPER_MODELS,
  WhisperTranscriptionOptions 
} from '@/lib/whisper';

// Define the model interface
interface WhisperModel {
  id: string;
  name: string;
  size: string;
}

// Create a list of available models from the Whisper library
const AVAILABLE_MODELS: WhisperModel[] = [
  { id: 'tiny', name: 'Tiny', size: '75MB' },
  { id: 'base', name: 'Base', size: '142MB' },
  { id: 'small', name: 'Small', size: '466MB' }
];

export const useWhisperTranscription = (
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void
) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState<WhisperModel>(AVAILABLE_MODELS[0]);
  const cancelRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Function to handle file selection
  const handleFileSelected = useCallback((selectedFile: File) => {
    // Check if file type is supported
    const isAudioFile = selectedFile.type.includes('audio/') || 
                       selectedFile.name.toLowerCase().endsWith('.mp3') || 
                       selectedFile.name.toLowerCase().endsWith('.wav');
    
    if (!isAudioFile) {
      setError("Unsupported file type. Please select an MP3 or WAV audio file.");
      toast({
        title: "Unsupported file type",
        description: "Please select an MP3 or WAV audio file.",
        variant: "destructive",
      });
      return;
    }
    
    // File is valid, update state
    setFile(selectedFile);
    setError(null);
    setProgress(0);
    
    // Log file selection for debugging
    console.log(`Selected file: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
  }, [toast]);

  // Function to select a Whisper model
  const selectModel = useCallback((model: WhisperModel) => {
    setSelectedModel(model);
    console.log(`Selected Whisper model: ${model.name} (${model.size})`);
  }, []);

  // Function to cancel an in-progress transcription
  const cancelTranscription = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current.abort();
      cancelRef.current = null;
    }
    setIsLoading(false);
    setProgress(0);
    toast({
      title: "Transcription cancelled",
      description: "The transcription process was stopped.",
    });
  }, [toast]);

  // Function to transcribe the selected audio file
  const transcribeAudioFile = useCallback(async () => {
    if (!file) {
      setError("No file selected. Please select an audio file first.");
      toast({
        title: "No file selected",
        description: "Please select an audio file first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setModelLoading(true);
    
    // Create a new AbortController for this transcription
    cancelRef.current = new AbortController();
    
    try {
      // Prepare transcription options
      const options: WhisperTranscriptionOptions = {
        model: selectedModel.id,
        language: 'en', // Default to English
        taskType: 'transcribe',
        onProgress: (progressValue) => {
          // For the first 40%, we're loading the model
          if (progressValue <= 40) {
            setModelLoadProgress(progressValue);
          } else {
            // After 40%, we're transcribing
            setModelLoading(false);
            setProgress(progressValue);
          }
        },
        abortSignal: cancelRef.current.signal
      };
      
      console.log(`Starting transcription of ${file.name} using ${selectedModel.name} model`);
      
      // Call the actual Whisper transcription implementation
      const result = await transcribeAudio(file, options);
      
      if (!result || !result.text) {
        throw new Error("Transcription failed to return valid text");
      }
      
      // Success! Extract transcript text and data
      const transcript = result.text;
      
      // Pass the result to the callback
      onTranscriptCreated(transcript, result, file);
      
      toast({
        title: "Transcription complete",
        description: `Successfully transcribed "${file.name}" using ${selectedModel.name} model.`,
      });
    } catch (error: any) {
      console.error("Transcription error:", error);
      const errorMessage = error.message || "An unknown error occurred during transcription.";
      setError(errorMessage);
      
      toast({
        title: "Transcription failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setModelLoading(false);
      setProgress(100); // Ensure progress is complete
      cancelRef.current = null;
    }
  }, [file, selectedModel, toast, onTranscriptCreated]);

  return {
    file,
    isLoading,
    error,
    progress,
    modelLoading,
    modelLoadProgress,
    availableModels: AVAILABLE_MODELS,
    selectedModel,
    handleFileSelected,
    transcribeAudioFile,
    selectModel,
    cancelTranscription
  };
};


import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Define the model interface
interface WhisperModel {
  id: string;
  name: string;
  size: string;
}

// Create a list of available models
const WHISPER_MODELS: WhisperModel[] = [
  { id: 'tiny', name: 'Tiny', size: '75MB' },
  { id: 'base', name: 'Base', size: '142MB' },
  { id: 'small', name: 'Small', size: '466MB' },
  { id: 'medium', name: 'Medium', size: '1.5GB' },
  { id: 'large', name: 'Large', size: '3GB' }
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
  const [selectedModel, setSelectedModel] = useState<WhisperModel>(WHISPER_MODELS[0]);
  const cancelRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Function to preload the Whisper model
  const preloadWhisperModel = () => {
    // This is a placeholder - implement actual model preloading 
    setModelLoading(true);
    const interval = setInterval(() => {
      setModelLoadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setModelLoading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    return () => clearInterval(interval);
  };

  const handleFileSelected = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setProgress(0);
    
    // Log file selection for debugging
    console.log(`Selected file: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
  }, []);

  const selectModel = useCallback((model: WhisperModel) => {
    setSelectedModel(model);
    // Optionally pre-load the model
    preloadWhisperModel();
  }, []);

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

  const transcribeAudioFile = useCallback(async () => {
    if (!file) {
      setError("No file selected. Please select an audio or video file first.");
      toast({
        title: "No file selected",
        description: "Please select an audio or video file first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    // Create a new AbortController for this transcription
    cancelRef.current = new AbortController();
    
    try {
      // First simulate model loading if it hasn't been loaded yet
      const cleanupModelLoading = preloadWhisperModel();
      
      // Wait for model loading (simulated)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Clean up the model loading simulation
      cleanupModelLoading();
      
      // Now simulate the actual transcription
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 5;
        if (currentProgress > 100) {
          currentProgress = 100;
          clearInterval(interval);
        }
        setProgress(currentProgress);
      }, 300);
      
      // Simulate transcription time based on file size
      const processingTime = Math.min(file.size / 100000, 10000);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      clearInterval(interval);
      
      // Mock result
      const mockTranscript = "This is a simulated transcript for testing purposes. It was processed using the Whisper model. In a real implementation, this would contain the actual transcribed content from the audio file.";
      const mockJsonData = {
        text: mockTranscript,
        segments: [
          {
            id: 0,
            start: 0,
            end: 5,
            text: "This is a simulated transcript for testing purposes.",
            speaker: "Speaker 1"
          },
          {
            id: 1,
            start: 5,
            end: 10,
            text: "It was processed using the Whisper model.",
            speaker: "Speaker 2"
          },
          {
            id: 2,
            start: 10,
            end: 15,
            text: "In a real implementation, this would contain the actual transcribed content from the audio file.",
            speaker: "Speaker 1"
          }
        ]
      };
      
      onTranscriptCreated(mockTranscript, mockJsonData, file);
      
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
    availableModels: WHISPER_MODELS,
    selectedModel,
    handleFileSelected,
    transcribeAudioFile,
    selectModel,
    cancelTranscription
  };
};

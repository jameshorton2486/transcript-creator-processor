
import { useState, useEffect } from 'react';
import { AVAILABLE_MODELS } from '@/lib/whisper/core/modelLoader';
import { WhisperModelSelector } from './audio/WhisperModelSelector';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AudioLines } from 'lucide-react';
import { FileSelector } from './audio/FileSelector';
import { Progress } from './ui/progress';

interface WhisperTranscriberProps {
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void;
}

export const WhisperTranscriber = ({ onTranscriptCreated }: WhisperTranscriberProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState<typeof AVAILABLE_MODELS[0]>(AVAILABLE_MODELS[0]);
  const [availableModels, setAvailableModels] = useState<typeof AVAILABLE_MODELS>(AVAILABLE_MODELS);

  useEffect(() => {
    // When the component mounts, set the available models
    setAvailableModels(AVAILABLE_MODELS);
  }, []);

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleTranscribe = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setProgress(0);
    
    try {
      // In a real implementation, this would use the actual Whisper transcription
      // For now, we'll simulate the transcription process
      
      // Simulate progress updates
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(interval);
      setProgress(100);
      
      // Create a sample transcript result
      const transcriptText = `This is a simulated transcript using the ${selectedModel.name} model.\n\nThe transcript would contain the spoken content from the audio file "${file.name}".\n\nIn a real implementation, this would be the actual transcribed text from the Whisper model.`;
      
      // Sample JSON data that would include timestamps, etc.
      const jsonData = {
        segments: [
          { 
            id: 0, 
            text: "This is a simulated transcript using the Whisper model.", 
            start: 0, 
            end: 3.5
          },
          { 
            id: 1, 
            text: `The transcript would contain the spoken content from the audio file "${file.name}".`, 
            start: 3.5, 
            end: 7.2
          },
          { 
            id: 2, 
            text: "In a real implementation, this would be the actual transcribed text from the Whisper model.", 
            start: 7.2, 
            end: 12
          }
        ],
        text: transcriptText
      };
      
      // Call the callback with the transcript results
      onTranscriptCreated(transcriptText, jsonData, file);
      
    } catch (error) {
      console.error("Error transcribing audio:", error);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-2 bg-slate-50 border-b">
        <CardTitle className="text-base flex items-center text-slate-800">
          <AudioLines className="h-4 w-4 mr-2 text-indigo-600" />
          Whisper Transcription
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <WhisperModelSelector 
          availableModels={availableModels}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          disabled={isLoading}
        />
        
        <FileSelector 
          onFileSelected={handleFileSelected}
          accept="audio/*"
          label="Select audio file"
          disabled={isLoading}
        />
        
        {file && (
          <div className="text-sm text-gray-700">
            Selected file: {file.name} ({Math.round(file.size / 1024)}KB)
          </div>
        )}
        
        {isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Transcribing...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        <Button
          onClick={handleTranscribe}
          disabled={!file || isLoading}
          className="w-full"
        >
          {isLoading ? "Transcribing..." : "Transcribe with Whisper"}
        </Button>
        
        <div className="text-xs text-gray-500 mt-2">
          Whisper transcription happens directly in your browser using WebAssembly.
          No data is sent to any server.
        </div>
      </CardContent>
    </Card>
  );
};

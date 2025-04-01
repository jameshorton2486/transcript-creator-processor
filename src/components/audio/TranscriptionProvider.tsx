
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranscriptionService } from "@/hooks/useTranscriptionService";
import { EnhancedFileSelector } from "@/components/audio/EnhancedFileSelector";
import { EnhancedProgressIndicator } from "@/components/audio/EnhancedProgressIndicator";
import { ApiKeySection } from "@/components/audio/ApiKeySection";
import { TranscriptionOptionsSection } from "@/components/audio/TranscriptionOptionsSection";
import { TranscriptionControls } from "@/components/audio/TranscriptionControls";
import { TranscriptionResult } from "@/components/audio/TranscriptionResult";

interface TranscriptionProviderProps {
  onTranscriptionComplete?: (transcript: string) => void;
  className?: string;
}

export const TranscriptionProvider: React.FC<TranscriptionProviderProps> = ({
  onTranscriptionComplete,
  className = ""
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [options, setOptions] = useState({
    punctuate: true,
    diarize: true,
    language: 'en'
  });

  const { 
    transcription, 
    isProcessing, 
    error, 
    handleTranscribe 
  } = useTranscriptionService();
  
  // Local state for progress tracking
  const [progress, setProgress] = useState(0);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleStartTranscribe = async () => {
    if (selectedFile) {
      // Start progress simulation
      setProgress(0);
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newValue = prev + Math.random() * 5;
          return newValue > 90 ? 90 : newValue;
        });
      }, 300);
      
      try {
        const result = await handleTranscribe(selectedFile);
        clearInterval(progressInterval);
        setProgress(100);
        
        if (result && onTranscriptionComplete) {
          onTranscriptionComplete(result.transcript);
        }
      } catch (e) {
        clearInterval(progressInterval);
        setProgress(0);
      }
    }
  };

  const handleOptionChange = (name: string, value: any) => {
    setOptions(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCancel = () => {
    // Cancel functionality - in a real implementation this would abort the request
    setProgress(0);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Audio Transcription</CardTitle>
          <CardDescription>Upload an audio file to create a transcript</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ApiKeySection 
            apiKey={apiKey} 
            setApiKey={setApiKey} 
            isProcessing={isProcessing} 
          />

          <EnhancedFileSelector
            onFileSelected={handleFileSelected}
            isLoading={isProcessing}
            maxSizeMB={100}
          />
          
          <TranscriptionOptionsSection
            options={options}
            onOptionChange={handleOptionChange}
            isProcessing={isProcessing}
          />
          
          <TranscriptionControls
            onStartTranscribe={handleStartTranscribe}
            onCancel={handleCancel}
            isProcessing={isProcessing}
            isDisabled={!selectedFile || !apiKey || isProcessing}
          />
        </CardContent>
      </Card>
      
      {isProcessing && (
        <EnhancedProgressIndicator 
          progress={progress} 
          isVisible={true}
          label="Transcribing audio..." 
        />
      )}
      
      <TranscriptionResult
        transcription={transcription}
        error={error}
      />
    </div>
  );
};

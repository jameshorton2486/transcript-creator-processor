
import React, { useState } from 'react';
import { EnhancedFileSelector } from "@/components/audio/EnhancedFileSelector";
import { useTranscriptionService } from "@/hooks/useTranscriptionService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, StopCircle, AlertCircle } from "lucide-react";
import { EnhancedProgressIndicator } from "@/components/audio/EnhancedProgressIndicator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input 
              id="api-key" 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your transcription service API key"
              disabled={isProcessing}
            />
            <p className="text-xs text-slate-500">Your API key is stored locally and not sent to our servers.</p>
          </div>

          <EnhancedFileSelector
            onFileSelected={handleFileSelected}
            isLoading={isProcessing}
            maxSizeMB={100}
          />
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Transcription Options</h3>
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="punctuate">Auto-punctuation</Label>
                  <p className="text-xs text-slate-500">Add punctuation and capitalization</p>
                </div>
                <Switch
                  id="punctuate"
                  checked={options.punctuate}
                  onCheckedChange={(checked) => handleOptionChange('punctuate', checked)}
                  disabled={isProcessing}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="diarize">Speaker Identification</Label>
                  <p className="text-xs text-slate-500">Identify different speakers</p>
                </div>
                <Switch
                  id="diarize"
                  checked={options.diarize}
                  onCheckedChange={(checked) => handleOptionChange('diarize', checked)}
                  disabled={isProcessing}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={options.language}
                  onChange={(e) => handleOptionChange('language', e.target.value)}
                  placeholder="Language code (e.g., en, es, fr)"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex space-x-2">
            <Button 
              onClick={handleStartTranscribe} 
              disabled={!selectedFile || !apiKey || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <Mic className="mr-2 h-4 w-4 animate-pulse" />
                  Transcribing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Mic className="mr-2 h-4 w-4" />
                  Start Transcription
                </span>
              )}
            </Button>
            
            {isProcessing && (
              <Button 
                variant="outline" 
                onClick={handleCancel}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isProcessing && (
        <EnhancedProgressIndicator 
          progress={progress} 
          isVisible={true}
          label="Transcribing audio..." 
        />
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      
      {transcription && (
        <Card>
          <CardHeader>
            <CardTitle>Transcription Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              readOnly 
              value={transcription} 
              className="min-h-[200px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

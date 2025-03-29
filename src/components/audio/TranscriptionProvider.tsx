
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
    transcribe, 
    isTranscribing, 
    progress, 
    result, 
    error, 
    cancel 
  } = useTranscriptionService({
    apiKey,
    onComplete: (result) => {
      if (result.transcript && onTranscriptionComplete) {
        onTranscriptionComplete(result.transcript);
      }
    }
  });

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleTranscribe = async () => {
    if (selectedFile) {
      await transcribe(selectedFile, {
        punctuate: options.punctuate,
        diarize: options.diarize,
        language: options.language
      });
    }
  };

  const handleOptionChange = (name: string, value: any) => {
    setOptions(prev => ({ ...prev, [name]: value }));
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
              disabled={isTranscribing}
            />
            <p className="text-xs text-slate-500">Your API key is stored locally and not sent to our servers.</p>
          </div>

          <EnhancedFileSelector
            onFileSelected={handleFileSelected}
            isLoading={isTranscribing}
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
                  disabled={isTranscribing}
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
                  disabled={isTranscribing}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={options.language}
                  onChange={(e) => handleOptionChange('language', e.target.value)}
                  placeholder="Language code (e.g., en, es, fr)"
                  disabled={isTranscribing}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex space-x-2">
            <Button 
              onClick={handleTranscribe} 
              disabled={!selectedFile || !apiKey || isTranscribing}
              className="flex-1"
            >
              {isTranscribing ? (
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
            
            {isTranscribing && (
              <Button 
                variant="outline" 
                onClick={cancel}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isTranscribing && (
        <EnhancedProgressIndicator 
          progress={progress} 
          isVisible={true}
          label="Transcribing audio..." 
        />
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {result && result.transcript && (
        <Card>
          <CardHeader>
            <CardTitle>Transcription Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              readOnly 
              value={result.transcript} 
              className="min-h-[200px] font-mono text-sm"
            />
            {result.confidence && (
              <p className="text-xs text-slate-500 mt-2">
                Confidence score: {(result.confidence * 100).toFixed(1)}%
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};


import React, { useState, useCallback } from 'react';
import { useDeepgramTranscription } from '@/hooks/useDeepgramTranscription';
import { TranscriptionResult } from '@/hooks/useDeepgramTranscription/types';
import { ApiKeyInput } from '@/components/audio/ApiKeyInput';
import { EnhancedFileSelector } from '@/components/audio/EnhancedFileSelector';
import { EnhancedProgressIndicator } from '@/components/audio/EnhancedProgressIndicator';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Clock, Mic, AlertCircle, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface DeepgramTranscriberProps {
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  initialApiKey?: string;
  showTranscription?: boolean;
}

const DeepgramTranscriber: React.FC<DeepgramTranscriberProps> = ({
  onTranscriptionComplete,
  initialApiKey = '',
  showTranscription = true,
}) => {
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const { toast } = useToast();

  const {
    file,
    isLoading,
    error,
    progress,
    apiKey,
    keyStatus,
    testingKey,
    estimatedTimeRemaining,
    keyErrorMessage,
    handleFileSelected,
    transcribeAudioFile,
    setApiKey,
    cancelTranscription,
    handleTestApiKey,
    setOptions,
  } = useDeepgramTranscription(
    (transcript, jsonData, file) => {
      if (transcript) {
        toast({
          title: "Transcription Complete",
          description: `Successfully transcribed ${file?.name || 'audio file'}.`,
        });
      }
    },
    { apiKey: initialApiKey }
  );

  // Handle transcription and update local state
  const handleTranscribe = useCallback(async () => {
    try {
      const result = await transcribeAudioFile();
      if (result) {
        setTranscriptionResult(result);
        onTranscriptionComplete?.(result);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Failed",
        description: error instanceof Error ? error.message : "An error occurred during transcription",
        variant: "destructive",
      });
    }
  }, [transcribeAudioFile, onTranscriptionComplete, toast]);

  const handleOptionsChange = useCallback(
    (name: string, value: any) => setOptions({ [name]: value }),
    [setOptions]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Transcribe Audio with Deepgram</h2>
        <p className="text-sm text-slate-500">
          Upload an audio file and transcribe it using Deepgram's advanced AI models.
        </p>
      </div>

      <Card className="p-4">
        <ApiKeyInput
          apiKey={apiKey}
          setApiKey={setApiKey}
          keyStatus={keyStatus}
          isDisabled={isLoading}
          provider="Deepgram"
          onVerify={handleTestApiKey}
          errorMessage={keyErrorMessage}
        />
      </Card>

      <Card className="p-4">
        <EnhancedFileSelector
          onFileSelected={handleFileSelected}
          isLoading={isLoading}
          supportedFormats={["mp3", "wav", "m4a", "mp4", "ogg", "flac"]}
        />
      </Card>

      <Card className="p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Transcription Options</h3>
          <Separator />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="diarize" 
                onCheckedChange={(checked) => handleOptionsChange('diarize', checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="diarize">Speaker Diarization</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="punctuate" 
                defaultChecked
                onCheckedChange={(checked) => handleOptionsChange('punctuate', checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="punctuate">Add Punctuation</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="smart_format" 
                defaultChecked
                onCheckedChange={(checked) => handleOptionsChange('smart_format', checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="smart_format">Smart Format</Label>
            </div>

            <div className="space-y-1">
              <Label htmlFor="model">Model</Label>
              <Select 
                defaultValue="nova-2"
                onValueChange={(value) => handleOptionsChange('model', value)}
                disabled={isLoading}
              >
                <SelectTrigger id="model" className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nova-2">Nova 2 (Recommended)</SelectItem>
                  <SelectItem value="nova">Nova</SelectItem>
                  <SelectItem value="enhanced">Enhanced</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-4 items-center">
        <Button
          onClick={handleTranscribe}
          disabled={!file || isLoading || keyStatus !== 'valid'}
          className="gap-2"
        >
          {isLoading ? (
            <span className="flex items-center">
              <Mic className="h-4 w-4 mr-2 animate-pulse" />
              Transcribing...
            </span>
          ) : (
            <span className="flex items-center">
              <Mic className="h-4 w-4 mr-2" />
              Start Transcription
            </span>
          )}
        </Button>

        {isLoading && (
          <Button variant="outline" onClick={cancelTranscription} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
        
        {estimatedTimeRemaining && (
          <span className="text-xs text-slate-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {estimatedTimeRemaining}
          </span>
        )}
      </div>

      {isLoading && (
        <EnhancedProgressIndicator
          progress={progress}
          isVisible={true}
          label="Transcribing audio..."
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {showTranscription && transcriptionResult && (
        <Card className="p-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Transcription Result</h3>
            <Separator />
            
            <div className="whitespace-pre-wrap bg-slate-50 p-3 rounded-md border border-slate-200 text-sm">
              {transcriptionResult.transcript}
            </div>

            {transcriptionResult.formattedResult?.speakerSegments?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-md font-medium">Speaker Segments</h4>
                
                <div className="space-y-2">
                  {transcriptionResult.formattedResult.speakerSegments.map((seg, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-md border border-slate-200">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-slate-800">{seg.speaker}</span>
                        <span className="text-xs text-slate-500">
                          {formatTime(seg.start)} - {formatTime(seg.end)}
                        </span>
                      </div>
                      <p className="text-sm">{seg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default DeepgramTranscriber;

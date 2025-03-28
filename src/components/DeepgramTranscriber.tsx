
import React, { useState, useCallback } from 'react';
import { useDeepgramTranscription } from '@/hooks/useDeepgramTranscription';
import { TranscriptionResult } from '@/hooks/useDeepgramTranscription/types';
import { DeepgramApiKeyInput } from '@/components/deepgram/DeepgramApiKeyInput';
import { EnhancedFileSelector } from '@/components/audio/EnhancedFileSelector';
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TranscriptionOptions } from '@/components/deepgram/TranscriptionOptions';
import { TranscriptionControls } from '@/components/deepgram/TranscriptionControls';
import { TranscriptionResultDisplay } from '@/components/deepgram/TranscriptionResult';

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
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
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

  const handleTranscribe = useCallback(async () => {
    // Reset previous errors and results
    setTranscriptionError(null);
    setTranscriptionResult(null);
    
    try {
      const result = await transcribeAudioFile();
      
      if (result) {
        if (!result.transcript || result.transcript.trim().length === 0) {
          setTranscriptionError("No speech was detected in the audio file. Please check the file and try again.");
          toast({
            title: "Transcription Warning",
            description: "No speech was detected in the audio file.",
            variant: "destructive",
          });
        } else {
          setTranscriptionResult(result);
          onTranscriptionComplete?.(result);
        }
      } else {
        setTranscriptionError("Transcription failed to produce a valid result.");
        toast({
          title: "Transcription Failed",
          description: "Failed to generate transcript.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred during transcription";
      setTranscriptionError(errorMessage);
      toast({
        title: "Transcription Failed",
        description: errorMessage,
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
        <DeepgramApiKeyInput
          apiKey={apiKey}
          setApiKey={setApiKey}
          handleTestApiKey={handleTestApiKey}
          keyStatus={keyStatus}
          testingKey={testingKey}
          keyErrorMessage={keyErrorMessage}
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
        <TranscriptionOptions 
          onOptionsChange={handleOptionsChange}
          isLoading={isLoading}
        />
      </Card>

      <TranscriptionControls
        handleTranscribe={handleTranscribe}
        cancelTranscription={cancelTranscription}
        file={file}
        isLoading={isLoading}
        keyStatus={keyStatus}
        error={error}
        progress={progress}
        estimatedTimeRemaining={estimatedTimeRemaining}
      />

      <TranscriptionResultDisplay
        result={transcriptionResult}
        error={transcriptionError || error}
        showTranscription={showTranscription}
      />
    </div>
  );
};

export default DeepgramTranscriber;

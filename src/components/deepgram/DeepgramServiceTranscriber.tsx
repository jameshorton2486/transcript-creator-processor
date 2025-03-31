
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, FileAudio, Loader2, Info } from 'lucide-react';
import { useDeepgramService } from '@/hooks/useDeepgramTranscription';
import type { TranscriptionResult } from '@/lib/deepgram/types';
import { DeepgramApiKeyInput } from './DeepgramApiKeyInput';
import { EnhancedFileSelector } from '@/components/audio/EnhancedFileSelector';
import { TranscriptionOptions } from './TranscriptionOptions';

interface DeepgramServiceTranscriberProps {
  className?: string;
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  showApiKeyInput?: boolean;
  initialApiKey?: string;
}

const DeepgramServiceTranscriber: React.FC<DeepgramServiceTranscriberProps> = ({
  className = '',
  onTranscriptionComplete,
  showApiKeyInput = true,
  initialApiKey = '',
}) => {
  const {
    apiKey,
    setApiKey,
    isApiKeyValid,
    isValidatingApiKey,
    apiKeyError,
    transcription,
    transcriptionError,
    isTranscribing,
    isProcessingComplete,
    selectedFile,
    setSelectedFile,
    requestOptions,
    updateRequestOptions,
    transcribeSelectedFile,
    validateKeyManually,
    resetTranscription
  } = useDeepgramService({ 
    initialApiKey,
    autoValidateKey: false 
  });

  const [activeTab, setActiveTab] = useState<string>('file');
  const [showProxyInfo, setShowProxyInfo] = useState<boolean>(true);

  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file);
    resetTranscription();
  }, [setSelectedFile, resetTranscription]);

  const handleTranscribe = useCallback(async () => {
    await transcribeSelectedFile();
    
    if (transcription && onTranscriptionComplete) {
      onTranscriptionComplete(transcription);
    }
  }, [transcribeSelectedFile, transcription, onTranscriptionComplete]);

  const handleOptionChange = useCallback((name: string, value: any) => {
    updateRequestOptions({ [name]: value });
  }, [updateRequestOptions]);

  return (
    <div className={`space-y-6 ${className}`}>
      {showProxyInfo && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <Info className="h-4 w-4 text-amber-800" />
          <AlertDescription className="text-sm">
            For optimal performance, ensure the Express proxy server is running. This handles 
            Deepgram API requests and avoids CORS issues. Check server/README.md for instructions.
          </AlertDescription>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-amber-800 hover:text-amber-900 hover:bg-amber-100 absolute right-2 top-2"
            onClick={() => setShowProxyInfo(false)}
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {/* API Key Section */}
      {showApiKeyInput && (
        <Card>
          <CardHeader>
            <CardTitle>API Key</CardTitle>
            <CardDescription>
              Enter your Deepgram API key to enable transcription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeepgramApiKeyInput
              apiKey={apiKey}
              setApiKey={setApiKey}
              handleTestApiKey={validateKeyManually}
              keyStatus={isApiKeyValid ? 'valid' : apiKeyError ? 'invalid' : 'untested'}
              testingKey={isValidatingApiKey}
              keyErrorMessage={apiKeyError || undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Transcription Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Transcription</CardTitle>
          <CardDescription>
            Upload an audio file to transcribe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="file" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="file">File Upload</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="space-y-4">
              <EnhancedFileSelector
                onFileSelected={handleFileSelected}
                isLoading={isTranscribing}
                maxSizeMB={250}
                supportedFormats={["mp3", "wav", "m4a", "mp4", "ogg", "flac"]}
              />
            </TabsContent>
            
            <TabsContent value="options">
              <TranscriptionOptions 
                onOptionsChange={handleOptionChange}
                isLoading={isTranscribing}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={resetTranscription}
            disabled={!transcription && !transcriptionError}
          >
            Reset
          </Button>
          <Button
            onClick={handleTranscribe}
            disabled={!selectedFile || isTranscribing || !isApiKeyValid}
            className="gap-2"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Transcribing...
              </>
            ) : (
              <>
                <FileAudio className="h-4 w-4" />
                Transcribe
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Progress Indicator */}
      {isTranscribing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing audio...</span>
            <span className="text-slate-500">This may take a minute</span>
          </div>
          <Progress value={100} className="h-2 animate-pulse" />
        </div>
      )}

      {/* Error Display */}
      {transcriptionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Transcription Failed</AlertTitle>
          <AlertDescription>{transcriptionError}</AlertDescription>
        </Alert>
      )}

      {/* Transcription Result */}
      {transcription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transcription Result</span>
              {transcription.confidence > 0 && (
                <span className="text-sm font-normal text-slate-500">
                  Confidence: {(transcription.confidence * 100).toFixed(1)}%
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto p-4 bg-slate-50 rounded-md border border-slate-200">
              <p className="text-sm whitespace-pre-wrap">{transcription.transcript}</p>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-slate-500">
            {selectedFile && (
              <div className="flex items-center gap-1">
                <FileAudio className="h-3 w-3" />
                <span>{selectedFile.name}</span>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default DeepgramServiceTranscriber;

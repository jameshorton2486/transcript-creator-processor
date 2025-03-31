
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeepgramService } from '@/hooks/useDeepgramTranscription';
import type { TranscriptionResult } from '@/lib/deepgram/types';
import { ApiKeySection } from './ApiKeySection';
import { ProxyInfoAlert } from './ProxyInfoAlert';
import { TranscriptionTabs } from './TranscriptionTabs';
import { TranscriptionControlsFooter } from './TranscriptionControls';
import { TranscriptionProgress } from './TranscriptionProgress';
import { TranscriptionError } from './TranscriptionError';
import { TranscriptionResultDisplay } from './TranscriptionResult';

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
    console.log("[DEEPGRAM UI] File selected:", {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    });
    setSelectedFile(file);
    resetTranscription();
  }, [setSelectedFile, resetTranscription]);

  const handleTranscribe = useCallback(async () => {
    console.log("[DEEPGRAM UI] Transcribe button clicked");
    
    if (!selectedFile) {
      console.log("[DEEPGRAM UI] No file selected, aborting transcription");
      return;
    }
    
    if (!isApiKeyValid) {
      console.log("[DEEPGRAM UI] API key not validated yet");
      const validated = await validateKeyManually();
      if (!validated) {
        console.log("[DEEPGRAM UI] API key validation failed, aborting transcription");
        return;
      }
    }
    
    console.log("[DEEPGRAM UI] Starting transcription process");
    await transcribeSelectedFile();
    
    if (transcription && onTranscriptionComplete) {
      console.log("[DEEPGRAM UI] Transcription complete, calling onTranscriptionComplete callback");
      onTranscriptionComplete(transcription);
    }
  }, [transcribeSelectedFile, transcription, onTranscriptionComplete, selectedFile, isApiKeyValid, validateKeyManually]);

  const handleOptionChange = useCallback((name: string, value: any) => {
    console.log(`[DEEPGRAM UI] Transcription option changed: ${name} = ${value}`);
    updateRequestOptions({ [name]: value });
  }, [updateRequestOptions]);

  return (
    <div className={`space-y-6 ${className}`}>
      <ProxyInfoAlert 
        showProxyInfo={showProxyInfo} 
        setShowProxyInfo={setShowProxyInfo} 
      />

      <ApiKeySection 
        showApiKeyInput={showApiKeyInput}
        apiKey={apiKey}
        setApiKey={setApiKey}
        validateKeyManually={validateKeyManually}
        isApiKeyValid={isApiKeyValid}
        isValidatingApiKey={isValidatingApiKey}
        apiKeyError={apiKeyError}
      />

      <Card>
        <CardHeader>
          <CardTitle>Transcription</CardTitle>
          <CardDescription>
            Upload an audio file to transcribe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TranscriptionTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleFileSelected={handleFileSelected}
            isTranscribing={isTranscribing}
            handleOptionChange={handleOptionChange}
          />
        </CardContent>
        <TranscriptionControlsFooter
          handleTranscribe={handleTranscribe}
          resetTranscription={resetTranscription}
          selectedFile={selectedFile}
          isTranscribing={isTranscribing}
          isApiKeyValid={isApiKeyValid}
          hasTranscription={!!transcription || !!transcriptionError}
        />
      </Card>

      <TranscriptionProgress isTranscribing={isTranscribing} />
      <TranscriptionError error={transcriptionError} />
      <TranscriptionResultDisplay 
        transcription={transcription} 
        selectedFile={selectedFile} 
      />
    </div>
  );
};

export default DeepgramServiceTranscriber;

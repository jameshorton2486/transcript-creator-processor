
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FileSelector } from "@/components/audio/FileSelector";
import { TranscriptionOptionsSelector } from "@/components/audio/TranscriptionOptions";
import { ApiKeyInput } from "@/components/audio/ApiKeyInput";
import { ProgressIndicator } from "@/components/audio/ProgressIndicator";
import { ErrorDisplay } from "@/components/audio/ErrorDisplay";
import { LargeFileAlert } from "@/components/audio/LargeFileAlert";
import { TranscribeButton } from "@/components/audio/TranscribeButton";
import { useTranscription } from "@/hooks/useTranscription";

interface AudioTranscriberProps {
  onTranscriptCreated: (transcript: string, jsonData: any) => void;
}

export const AudioTranscriber = ({ onTranscriptCreated }: AudioTranscriberProps) => {
  const {
    file,
    isLoading,
    error,
    options,
    apiKey,
    progress,
    isBatchProcessing,
    handleFileSelected,
    transcribeAudioFile,
    setOptions,
    setApiKey,
    setError
  } = useTranscription(onTranscriptCreated);

  // Calculate estimated file size in MB
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : "0";
  const isLargeFile = file && file.size > 10 * 1024 * 1024;

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <CardTitle>Audio Transcription</CardTitle>
        <CardDescription>Upload an audio file to create a transcript</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <ApiKeyInput 
          apiKey={apiKey} 
          onApiKeyChange={setApiKey} 
        />

        <FileSelector 
          onFileSelected={handleFileSelected}
          isLoading={isLoading}
        />
        
        <LargeFileAlert 
          isVisible={!!file && isLargeFile && !isLoading} 
          fileSizeMB={fileSizeMB}
        />
        
        <ProgressIndicator 
          progress={progress} 
          isVisible={isLoading && isBatchProcessing}
        />
        
        <ErrorDisplay error={error} />
        
        <TranscriptionOptionsSelector 
          options={options}
          onOptionsChange={setOptions}
        />
        
        <TranscribeButton 
          onClick={transcribeAudioFile}
          isDisabled={!file || isLoading || !apiKey}
          isLoading={isLoading}
          isBatchProcessing={isBatchProcessing}
          progress={progress}
        />
      </CardContent>
      
      <CardFooter className="bg-slate-50 text-xs text-slate-500 italic">
        Transcription powered by Google Live Transcribe. Can process files up to 6 hours long. 
        Larger files will be processed in batches.
      </CardFooter>
    </Card>
  );
};


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileSelector } from "@/components/audio/FileSelector";
import { TranscriptionOptionsSelector } from "@/components/audio/TranscriptionOptions";
import { ApiKeyInput } from "@/components/audio/ApiKeyInput";
import { ProgressIndicator } from "@/components/audio/ProgressIndicator";
import { ErrorDisplay } from "@/components/audio/ErrorDisplay";
import { LargeFileAlert } from "@/components/audio/LargeFileAlert";
import { TranscribeButton } from "@/components/audio/TranscribeButton";
import { CustomTerminologySection } from "@/components/audio/CustomTerminologySection";
import { MemoryWarningAlert } from "@/components/audio/MemoryWarningAlert";
import { TranscriberFooter } from "@/components/audio/TranscriberFooter";
import { useTranscription } from "@/hooks/useTranscription";
import { useState, useEffect } from "react";
import { estimateMemoryRequirements } from "@/lib/google/audio/fileChunker";
import { MAX_CHUNK_DURATION_SECONDS } from "@/lib/audio/chunkProcessor";

// Increased file size threshold to 200MB
const LARGE_FILE_THRESHOLD = 200 * 1024 * 1024;
// Threshold for showing memory-efficient processing message
const MEMORY_EFFICIENT_THRESHOLD = 10 * 1024 * 1024; // 10MB

interface AudioTranscriberProps {
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void;
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
    customTerms,
    handleFileSelected,
    transcribeAudioFile,
    setOptions,
    setApiKey,
    setError,
    setCustomTerms
  } = useTranscription((transcript, jsonData) => {
    // Pass the file along with the transcript and JSON data
    onTranscriptCreated(transcript, jsonData, file);
  });

  const [memoryWarning, setMemoryWarning] = useState<string | null>(null);
  const [durationWarning, setDurationWarning] = useState<string | null>(null);

  // Calculate estimated file size in MB
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : "0";
  const isLargeFile = file && file.size > MEMORY_EFFICIENT_THRESHOLD;

  // Check for potential memory issues when file is selected
  useEffect(() => {
    if (file) {
      const { estimatedMemoryMB, isMemoryCritical, recommendedChunkCount } = estimateMemoryRequirements(file.size);
      
      if (isMemoryCritical) {
        setMemoryWarning(`This file may require up to ${estimatedMemoryMB.toFixed(0)}MB of memory to process. The application will automatically use batch processing with ${recommendedChunkCount} chunks.`);
      } else {
        setMemoryWarning(null);
      }
      
      // Estimate duration based on file size (rough estimate: 16-bit mono at 16kHz = ~32KB per second)
      const estimatedDurationSec = file.size / (32 * 1024);
      if (estimatedDurationSec > MAX_CHUNK_DURATION_SECONDS) {
        setDurationWarning(`This file appears to be longer than ${MAX_CHUNK_DURATION_SECONDS} seconds. It will be automatically processed in smaller chunks to comply with Google's API limitations.`);
      } else {
        setDurationWarning(null);
      }
    } else {
      setMemoryWarning(null);
      setDurationWarning(null);
    }
  }, [file]);

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
        
        <MemoryWarningAlert warningMessage={memoryWarning} />
        
        {durationWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
            <p>{durationWarning}</p>
          </div>
        )}
        
        <CustomTerminologySection 
          customTerms={customTerms}
          setCustomTerms={setCustomTerms}
        />
        
        <LargeFileAlert 
          isVisible={!!file && file.size > MEMORY_EFFICIENT_THRESHOLD && !isLoading} 
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
      
      <TranscriberFooter />
    </Card>
  );
};

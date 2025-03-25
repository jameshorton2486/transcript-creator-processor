
import { useState, useEffect } from "react";
import { TranscriberCard } from "@/components/audio/TranscriberCard";
import { FileSelector } from "@/components/audio/FileSelector";
import { TranscriptionOptionsSelector } from "@/components/audio/TranscriptionOptions";
import { ApiKeyInput } from "@/components/audio/ApiKeyInput";
import { ErrorDisplay } from "@/components/audio/ErrorDisplay";
import { CustomTerminologySection } from "@/components/audio/CustomTerminologySection";
import { TranscribeButton } from "@/components/audio/TranscribeButton";
import { FileWarnings } from "@/components/audio/FileWarnings";
import { useTranscription } from "@/hooks/useTranscription";
import { estimateMemoryRequirements } from "@/lib/google/audio/fileChunker";
import { MAX_CHUNK_DURATION_SECONDS } from "@/lib/audio/chunkProcessor";
import { TranscriptionOptions } from "@/lib/config";

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

  // Create a wrapper function to handle type compatibility
  const handleOptionsChange = (newOptions: TranscriptionOptions) => {
    setOptions(newOptions as any);
  };

  return (
    <TranscriberCard>
      <ApiKeyInput 
        apiKey={apiKey} 
        onApiKeyChange={setApiKey} 
      />

      <FileSelector 
        onFileSelected={handleFileSelected}
        isLoading={isLoading}
      />
      
      <FileWarnings
        memoryWarning={memoryWarning}
        durationWarning={durationWarning}
        file={file}
        isLoading={isLoading}
        fileSizeMB={fileSizeMB}
        memoryThreshold={MEMORY_EFFICIENT_THRESHOLD}
      />
      
      <CustomTerminologySection 
        customTerms={customTerms}
        setCustomTerms={setCustomTerms}
      />
      
      <ErrorDisplay error={error} />
      
      <TranscriptionOptionsSelector 
        options={options}
        onOptionsChange={handleOptionsChange}
      />
      
      <TranscribeButton 
        onClick={transcribeAudioFile}
        isDisabled={!file || isLoading || !apiKey}
        isLoading={isLoading}
        isBatchProcessing={isBatchProcessing}
        progress={progress}
      />
    </TranscriberCard>
  );
};


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FileSelector } from "@/components/audio/FileSelector";
import { TranscriptionOptionsSelector } from "@/components/audio/TranscriptionOptions";
import { ApiKeyInput } from "@/components/audio/ApiKeyInput";
import { ProgressIndicator } from "@/components/audio/ProgressIndicator";
import { ErrorDisplay } from "@/components/audio/ErrorDisplay";
import { LargeFileAlert } from "@/components/audio/LargeFileAlert";
import { TranscribeButton } from "@/components/audio/TranscribeButton";
import { TerminologyExtractor } from "@/components/TerminologyExtractor";
import { useTranscription } from "@/hooks/useTranscription";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

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

  const [showTerminologyExtractor, setShowTerminologyExtractor] = useState(false);

  // Calculate estimated file size in MB
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : "0";
  const isLargeFile = file && file.size > 10 * 1024 * 1024;

  const handleTermsExtracted = (terms: string[]) => {
    setCustomTerms(terms);
  };

  const removeTerm = (termToRemove: string) => {
    setCustomTerms(customTerms.filter(term => term !== termToRemove));
  };

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
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowTerminologyExtractor(!showTerminologyExtractor)}
        >
          {showTerminologyExtractor ? "Hide Terminology Extractor" : "Add Custom Terminology"}
        </Button>
        
        {showTerminologyExtractor && (
          <TerminologyExtractor onTermsExtracted={handleTermsExtracted} />
        )}
        
        {customTerms.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-md">
            <h3 className="text-sm font-medium mb-2">
              Speech Adaptation Terms ({customTerms.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {customTerms.map((term, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {term}
                  <button 
                    onClick={() => removeTerm(term)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
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

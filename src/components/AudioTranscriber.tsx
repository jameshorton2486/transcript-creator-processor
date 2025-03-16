
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
import { X, Upload, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FileUploader } from "@/components/FileUploader";

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
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isExtractingTerms, setIsExtractingTerms] = useState(false);

  // Calculate estimated file size in MB
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : "0";
  const isLargeFile = file && file.size > 10 * 1024 * 1024;

  const handleTermsExtracted = (terms: string[]) => {
    setCustomTerms(terms);
    setIsExtractingTerms(false);
  };

  const removeTerm = (termToRemove: string) => {
    setCustomTerms(customTerms.filter(term => term !== termToRemove));
  };

  const handleDocumentUpload = (files: File[]) => {
    if (!files.length) return;
    
    // Just use the first file for now for backward compatibility
    const file = files[0];
    setDocumentFile(file);
    setIsExtractingTerms(true);
    
    try {
      // The TerminologyExtractor component will handle the actual extraction
      // This is just to trigger the visual state
      setTimeout(() => {
        setShowTerminologyExtractor(true);
      }, 100);
    } catch (error) {
      console.error("Error processing document:", error);
      setIsExtractingTerms(false);
    }
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
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Custom Terminology</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowTerminologyExtractor(!showTerminologyExtractor)}
            >
              {showTerminologyExtractor ? "Hide" : "Show"} Tools
            </Button>
          </div>
          
          <Separator />
          
          {showTerminologyExtractor && (
            <div className="space-y-4 p-3 bg-slate-50 rounded-md">
              <div className="text-sm">
                <p className="font-medium mb-2">Upload document with terminology</p>
                <p className="text-xs text-slate-500 mb-3">
                  Extract custom terms from PDF or Word documents to improve transcription accuracy
                </p>
                
                <FileUploader
                  file={documentFile}
                  onFileChange={handleDocumentUpload}
                  acceptedFileTypes=".pdf,.docx,.doc"
                />
              </div>
              
              <Separator className="my-3" />
              
              <TerminologyExtractor 
                onTermsExtracted={handleTermsExtracted} 
                documentFile={documentFile}
                isLoading={isExtractingTerms}
                setIsLoading={setIsExtractingTerms}
              />
            </div>
          )}
        </div>
        
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

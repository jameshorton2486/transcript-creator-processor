
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mic, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { DEFAULT_TRANSCRIPTION_OPTIONS } from "@/lib/config";
import { transcribeAudio, extractTranscriptText, testApiKey } from "@/lib/google";
import { FileSelector } from "@/components/audio/FileSelector";
import { TranscriptionOptionsSelector } from "@/components/audio/TranscriptionOptions";
import { ApiKeyInput } from "@/components/audio/ApiKeyInput";

interface AudioTranscriberProps {
  onTranscriptCreated: (transcript: string, jsonData: any) => void;
}

export const AudioTranscriber = ({ onTranscriptCreated }: AudioTranscriberProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState(DEFAULT_TRANSCRIPTION_OPTIONS);
  const [apiKey, setApiKey] = useState("");
  const [progress, setProgress] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsBatchProcessing(selectedFile.size > 10 * 1024 * 1024);
  };

  const transcribeAudioFile = async () => {
    if (!file) {
      setError("No file selected. Please select an audio or video file first.");
      toast({
        title: "No file selected",
        description: "Please select an audio or video file first.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      setError("Google API key is required for transcription.");
      toast({
        title: "API Key Required",
        description: "Please enter your Google Speech-to-Text API key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // First, verify the API key is valid
      const isKeyValid = await testApiKey(apiKey);
      if (!isKeyValid) {
        throw new Error("API key is invalid or unauthorized");
      }
      
      const isLargeFile = file.size > 10 * 1024 * 1024;
      
      if (isLargeFile) {
        toast({
          title: "Processing large file",
          description: "Your file will be processed in batches. This may take several minutes.",
        });
        setIsBatchProcessing(true);
      }
      
      console.log(`Starting transcription for file: ${file.name} (${file.type})`);
      
      const response = await transcribeAudio(
        file, 
        apiKey, 
        options, 
        isLargeFile ? setProgress : undefined
      );
      
      console.log("Transcription response received:", response);
      
      const transcriptText = extractTranscriptText(response);
      
      if (transcriptText === "No transcript available" || transcriptText === "Error extracting transcript") {
        throw new Error("Failed to extract transcript from the API response.");
      }
      
      onTranscriptCreated(transcriptText, response);
      toast({
        title: "Transcription complete",
        description: "The audio has been successfully transcribed.",
      });
    } catch (error: any) {
      console.error("Transcription error:", error);
      
      let errorMessage = "Failed to transcribe file. ";
      
      if (error.message?.includes("API key")) {
        errorMessage += "Please check your API key is valid.";
      } else if (error.message?.includes("Network") || error.message?.includes("fetch")) {
        errorMessage += "Network error. Please check your internet connection.";
      } else if (error.message?.includes("quota")) {
        errorMessage += "API quota exceeded. Please try again later or use a different API key.";
      } else if (error.message?.includes("too large")) {
        errorMessage += "This file is too large for direct processing. The application will try to process it in batches.";
      } else if (error.message?.includes("unsupported file type")) {
        errorMessage += "The file format is not supported. Please use MP3, WAV, FLAC, or OGG format.";
      } else {
        errorMessage += `Error details: ${error.message || "Unknown error"}`;
      }
      
      setError(errorMessage);
      toast({
        title: "Transcription failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsBatchProcessing(false);
      setProgress(0);
    }
  };

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
        
        {file && isLargeFile && !isLoading && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Large File Detected</AlertTitle>
            <AlertDescription className="text-amber-800">
              This {fileSizeMB} MB file exceeds the 10MB limit for direct API processing. 
              It will be automatically processed in batches. This may take several minutes.
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading && isBatchProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing in batches</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-slate-500 italic">
              Large files are processed in chunks. Please be patient.
            </p>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <TranscriptionOptionsSelector 
          options={options}
          onOptionsChange={setOptions}
        />
        
        <Button 
          className="w-full" 
          onClick={transcribeAudioFile} 
          disabled={!file || isLoading || !apiKey}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isBatchProcessing ? `Processing (${progress}%)` : "Transcribing..."}
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Transcribe Audio
            </>
          )}
        </Button>
      </CardContent>
      
      <CardFooter className="bg-slate-50 text-xs text-slate-500 italic">
        Transcription powered by Google Live Transcribe. Can process files up to 6 hours long. 
        Larger files will be processed in batches.
      </CardFooter>
    </Card>
  );
};

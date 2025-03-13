
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mic, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DEFAULT_TRANSCRIPTION_OPTIONS } from "@/lib/config";
import { transcribeAudio, extractTranscriptText } from "@/lib/googleTranscribeService";
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
  const { toast } = useToast();

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
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
    
    try {
      const response = await transcribeAudio(file, apiKey, options);
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
      } else {
        errorMessage += "Please check your API key and try again.";
      }
      
      setError(errorMessage);
      toast({
        title: "Transcription failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
              Transcribing...
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
        Transcription powered by Google Live Transcribe. Processing may take a few minutes for larger files.
      </CardFooter>
    </Card>
  );
};

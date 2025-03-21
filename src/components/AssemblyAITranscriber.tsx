
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileSelector } from "@/components/audio/FileSelector";
import { ProgressIndicator } from "@/components/audio/ProgressIndicator";
import { ErrorDisplay } from "@/components/audio/ErrorDisplay";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TranscriberFooter } from "@/components/audio/TranscriberFooter";
import { useAssemblyAITranscription } from "@/hooks/useAssemblyAITranscription";
import { Mic, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { testApiKey } from "@/lib/assemblyai";

interface AssemblyAITranscriberProps {
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void;
}

export const AssemblyAITranscriber = ({ onTranscriptCreated }: AssemblyAITranscriberProps) => {
  const {
    file,
    isLoading,
    error,
    progress,
    apiKey,
    handleFileSelected,
    transcribeAudioFile,
    setApiKey,
    cancelTranscription
  } = useAssemblyAITranscription(onTranscriptCreated);

  const [keyStatus, setKeyStatus] = useState<"untested" | "valid" | "invalid">("untested");
  const [testingKey, setTestingKey] = useState(false);
  const { toast } = useToast();

  // Calculate estimated file size in MB
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : "0";

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "No API key",
        description: "Please enter an AssemblyAI API key to test",
        variant: "destructive",
      });
      return;
    }

    setTestingKey(true);
    setKeyStatus("untested");

    try {
      const isValid = await testApiKey(apiKey);
      setKeyStatus(isValid ? "valid" : "invalid");
      
      toast({
        title: isValid ? "API key is valid" : "API key is invalid",
        description: isValid 
          ? "Your AssemblyAI API key is working correctly" 
          : "The provided API key was rejected. Please check your key and try again.",
        variant: isValid ? "default" : "destructive",
      });
    } catch (error) {
      setKeyStatus("invalid");
      toast({
        title: "Error testing API key",
        description: "Could not connect to AssemblyAI API. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setTestingKey(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <CardTitle>Audio Transcription with AssemblyAI</CardTitle>
        <CardDescription>Upload an audio file to create a transcript</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <FileSelector 
          onFileSelected={handleFileSelected}
          isLoading={isLoading}
        />
        
        <div className="space-y-2">
          <Label htmlFor="api-key">AssemblyAI API Key</Label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your AssemblyAI API key"
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestApiKey}
              disabled={testingKey || !apiKey.trim() || isLoading}
              className="whitespace-nowrap"
            >
              {testingKey ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : keyStatus === "valid" ? (
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              ) : keyStatus === "invalid" ? (
                <XCircle className="mr-2 h-4 w-4 text-red-500" />
              ) : null}
              Test Key
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your API key from <a href="https://www.assemblyai.com/" target="_blank" rel="noreferrer" className="underline">AssemblyAI</a>
          </p>
        </div>
        
        <ProgressIndicator 
          progress={progress} 
          isVisible={isLoading}
          label="Transcribing audio..."
        />
        
        <ErrorDisplay error={error} />
        
        <Button 
          className="w-full" 
          onClick={transcribeAudioFile} 
          disabled={!file || !apiKey || isLoading || keyStatus === "invalid"}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Transcribing ({progress}%)
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Transcribe with AssemblyAI
            </>
          )}
        </Button>
        
        {isLoading && (
          <Button 
            variant="outline" 
            className="w-full mt-2" 
            onClick={cancelTranscription}
          >
            Cancel Transcription
          </Button>
        )}
        
        {file && !isLoading && (
          <p className="text-xs text-slate-500 text-center">
            {file.name} ({fileSizeMB} MB)
          </p>
        )}
      </CardContent>
      
      <TranscriberFooter />
    </Card>
  );
};

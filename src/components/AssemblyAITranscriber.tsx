
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
    keyStatus,
    testingKey,
    handleFileSelected,
    transcribeAudioFile,
    setApiKey,
    cancelTranscription,
    handleTestApiKey
  } = useAssemblyAITranscription(onTranscriptCreated);

  // Calculate estimated file size in MB
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : "0";

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
              className={`flex-1 ${keyStatus === "invalid" ? "border-red-400" : ""}`}
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
              Transcribing {progress > 0 && progress < 100 ? `(${Math.round(progress)}%)` : '...'}
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


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FileSelector } from "@/components/audio/FileSelector";
import { ProgressIndicator } from "@/components/audio/ProgressIndicator";
import { ErrorDisplay } from "@/components/audio/ErrorDisplay";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TranscriberFooter } from "@/components/audio/TranscriberFooter";
import { useAssemblyAITranscription } from "@/hooks/useAssemblyAITranscription";
import { Mic, Loader2, CheckCircle, XCircle, AlertCircle, FileIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AssemblyAITranscriberProps {
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void;
}

/**
 * AssemblyAITranscriber Component
 * 
 * This component provides a user interface for transcribing audio files using AssemblyAI's API.
 * It allows users to upload audio files, enter their API key, and view the transcription progress.
 * 
 * @param {Function} onTranscriptCreated - Callback function triggered when transcription is complete
 */
export const AssemblyAITranscriber = ({ onTranscriptCreated }: AssemblyAITranscriberProps) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [transcriptionModel, setTranscriptionModel] = useState("default");
  const [enableSpeakerLabels, setEnableSpeakerLabels] = useState(true);
  
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
    handleTestApiKey,
    estimatedTimeRemaining
  } = useAssemblyAITranscription(onTranscriptCreated, {
    model: transcriptionModel as any,
    speakerLabels: enableSpeakerLabels
  });

  // Calculate estimated file size in MB
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : "0";
  
  // Format supported file types for display
  const supportedFormats = ["mp3", "wav", "m4a", "flac", "ogg", "aac"];
  
  // Calculate if file is too large (over 100MB)
  const isFileTooLarge = file && file.size > 100 * 1024 * 1024;

  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex items-center">
          <Mic className="mr-2 h-5 w-5 text-primary" />
          Audio Transcription with AssemblyAI
        </CardTitle>
        <CardDescription>Upload an audio file to create a transcript with AI-powered speech recognition</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-4">
        <FileSelector 
          onFileSelected={handleFileSelected}
          isLoading={isLoading}
          supportedFormats={supportedFormats}
          maxSizeMB={100}
        />
        
        {file && !isLoading && (
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
            <div className="flex items-center">
              <FileIcon className="h-4 w-4 mr-2 text-slate-600" />
              <span className="text-sm font-medium truncate max-w-[200px]" title={file.name}>
                {file.name}
              </span>
            </div>
            <span className="text-xs text-slate-500 ml-2">
              {fileSizeMB} MB
            </span>
            {isFileTooLarge && (
              <div className="flex items-center text-red-500 text-xs ml-2">
                <AlertCircle className="h-3 w-3 mr-1" />
                File too large
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="api-key">AssemblyAI API Key</Label>
            {keyStatus === "valid" && (
              <span className="text-xs text-green-600 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" /> Valid key
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your AssemblyAI API key"
              disabled={isLoading}
              className={`flex-1 ${keyStatus === "invalid" ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              aria-invalid={keyStatus === "invalid"}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>Verify your API key works before transcribing</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {keyStatus === "invalid" && (
            <p className="text-xs text-red-500">
              Invalid API key. Please check and try again.
            </p>
          )}
          
          <p className="text-xs text-muted-foreground">
            Get your API key from <a href="https://www.assemblyai.com/" target="_blank" rel="noreferrer" className="underline text-primary hover:text-primary/80 transition-colors">AssemblyAI</a>
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced-options">
            <AccordionTrigger 
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="py-2 text-sm"
            >
              Advanced Options
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-2">
              <div className="space-y-2">
                <Label htmlFor="transcription-model">Transcription Model</Label>
                <Select 
                  value={transcriptionModel}
                  onValueChange={setTranscriptionModel}
                  disabled={isLoading}
                >
                  <SelectTrigger id="transcription-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="enhanced">Enhanced (Highest Quality)</SelectItem>
                    <SelectItem value="nova2">Nova2 (Fastest)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Enhanced model provides higher accuracy but may take longer.
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="speaker-labels"
                  checked={enableSpeakerLabels}
                  onChange={(e) => setEnableSpeakerLabels(e.target.checked)}
                  disabled={isLoading}
                  className="rounded"
                />
                <Label htmlFor="speaker-labels" className="cursor-pointer">
                  Enable Speaker Diarization
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Identifies and labels different speakers in the transcript.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <ProgressIndicator 
          progress={progress} 
          isVisible={isLoading}
          label={`Transcribing audio... ${estimatedTimeRemaining ? `(${estimatedTimeRemaining} remaining)` : ''}`}
        />
        
        <ErrorDisplay error={error} />
        
        <Button 
          className="w-full" 
          onClick={transcribeAudioFile} 
          disabled={!file || !apiKey || isLoading || keyStatus === "invalid" || isFileTooLarge}
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
      </CardContent>
      
      <CardFooter className="border-t bg-slate-50 p-3">
        <TranscriberFooter />
      </CardFooter>
    </Card>
  );
};

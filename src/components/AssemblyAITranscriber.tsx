
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { EnhancedFileSelector } from "@/components/audio/EnhancedFileSelector";
import { EnhancedProgressIndicator } from "@/components/audio/EnhancedProgressIndicator";
import { ErrorDisplay } from "@/components/audio/ErrorDisplay";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TranscriberFooter } from "@/components/audio/TranscriberFooter";
import { useAssemblyAITranscription } from "@/hooks/useAssemblyAITranscription";
import { AssemblyAITranscriptionOptions } from "@/hooks/useAssemblyAITranscription/types";
import { Mic, Loader2, CheckCircle, XCircle, FileAudio, Info, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AssemblyAITranscriberProps {
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void;
  initialOptions?: Partial<AssemblyAITranscriptionOptions>;
}

/**
 * AssemblyAITranscriber Component
 * 
 * Provides a user interface for transcribing audio files using AssemblyAI's API.
 */
export const AssemblyAITranscriber: React.FC<AssemblyAITranscriberProps> = ({ 
  onTranscriptCreated,
  initialOptions
}) => {
  // Supported file formats
  const supportedFormats = ["mp3", "mp4", "wav", "m4a", "flac", "ogg", "aac", "wma"];
  const maxFileSizeMB = 250; // AssemblyAI supports up to 250MB files
  
  // Model information for tooltips
  const modelInfo = {
    "default": "Automatically selects the most appropriate model",
    "standard": "General-purpose transcription model",
    "enhanced": "Highest accuracy, but slower processing time",
    "nova2": "Fastest processing, but slightly lower accuracy"
  };

  // Advanced options state
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false);
  
  // Use the transcription hook
  const {
    file,
    isLoading,
    error,
    progress,
    apiKey,
    keyStatus,
    testingKey,
    estimatedTimeRemaining,
    handleFileSelected,
    transcribeAudioFile,
    setApiKey,
    cancelTranscription,
    handleTestApiKey,
    setOptions
  } = useAssemblyAITranscription(onTranscriptCreated, initialOptions);

  // Calculate file size in MB
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : "0";
  const isFileTooLarge = file && file.size > maxFileSizeMB * 1024 * 1024;

  // Helper to update model
  const handleModelChange = (model: string) => {
    setOptions({ model: model as "default" | "standard" | "enhanced" | "nova2" });
  };

  // Helper to update speaker labels
  const handleSpeakerLabelsChange = (enabled: boolean) => {
    setOptions({ speakerLabels: enabled });
  };

  return (
    <Card className="bg-white shadow-md border-slate-200">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center space-x-2">
          <FileAudio className="h-5 w-5 text-primary" />
          <CardTitle>Audio Transcription</CardTitle>
        </div>
        <CardDescription>
          Upload an audio file to automatically create a transcript using AssemblyAI
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* File Selection */}
        <EnhancedFileSelector 
          onFileSelected={handleFileSelected}
          isLoading={isLoading}
          supportedFormats={supportedFormats}
          maxSizeMB={maxFileSizeMB}
        />
        
        {/* Selected File Info */}
        {file && !isLoading && (
          <div className={`flex items-center justify-between p-3 rounded-md ${isFileTooLarge ? 'bg-red-50' : 'bg-slate-50'}`}>
            <div className="flex items-center max-w-[80%]">
              <FileAudio className="h-4 w-4 mr-2 text-slate-600 flex-shrink-0" />
              <span className="text-sm font-medium truncate" title={file.name}>
                {file.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">
                {fileSizeMB} MB
              </span>
              {isFileTooLarge && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-red-500 text-xs">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>File exceeds maximum size of {maxFileSizeMB}MB</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        )}
        
        {/* API Key Input */}
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
                    className="whitespace-nowrap flex-shrink-0"
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
        
        {/* Advanced Options */}
        <Accordion 
          type="single" 
          collapsible 
          className="w-full"
          value={advancedOptionsOpen ? "options" : undefined}
          onValueChange={(val) => setAdvancedOptionsOpen(val === "options")}
        >
          <AccordionItem value="options">
            <AccordionTrigger className="py-2 text-sm">
              Advanced Options
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-2">
              {/* Transcription Model Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="transcription-model">Transcription Model</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" align="end" className="max-w-sm">
                        <p className="font-medium mb-1">Model Types:</p>
                        <ul className="text-xs space-y-1">
                          <li><span className="font-medium">Default:</span> {modelInfo.default}</li>
                          <li><span className="font-medium">Standard:</span> {modelInfo.standard}</li>
                          <li><span className="font-medium">Enhanced:</span> {modelInfo.enhanced}</li>
                          <li><span className="font-medium">Nova2:</span> {modelInfo.nova2}</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select 
                  defaultValue={initialOptions?.model || "default"}
                  onValueChange={handleModelChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="transcription-model" className="w-full">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="enhanced">Enhanced (Highest Quality)</SelectItem>
                    <SelectItem value="nova2">Nova2 (Fastest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Speaker Diarization Option */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="speaker-labels" className="text-sm">
                    Speaker Diarization
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Identify and label different speakers
                  </p>
                </div>
                <Switch
                  id="speaker-labels"
                  checked={initialOptions?.speakerLabels !== false}
                  onCheckedChange={handleSpeakerLabelsChange}
                  disabled={isLoading}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {/* Progress Indicator */}
        {isLoading && (
          <EnhancedProgressIndicator 
            progress={progress} 
            isVisible={true}
            label={`Transcribing audio... ${estimatedTimeRemaining ? `(${estimatedTimeRemaining} remaining)` : ''}`}
          />
        )}
        
        {/* Error Display */}
        {error && <ErrorDisplay error={error} />}
        
        {/* Action Buttons */}
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
      
      <CardFooter className="border-t bg-slate-50 p-3 text-xs text-center text-slate-500">
        <TranscriberFooter />
      </CardFooter>
    </Card>
  );
};

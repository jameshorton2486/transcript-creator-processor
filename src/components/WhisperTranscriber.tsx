
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileSelector } from "@/components/audio/FileSelector";
import { ProgressIndicator } from "@/components/audio/ProgressIndicator";
import { ErrorDisplay } from "@/components/audio/ErrorDisplay";
import { WhisperModelSelector } from "@/components/audio/WhisperModelSelector";
import { TranscriberFooter } from "@/components/audio/TranscriberFooter";
import { useWhisperTranscription } from "@/hooks/useWhisperTranscription";
import { Mic, Loader2, X, HardDrive, Cpu } from "lucide-react";
import { checkModelAvailability, getModelSize } from "@/lib/whisper/core/modelLoader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WhisperTranscriberProps {
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void;
}

export const WhisperTranscriber = ({ onTranscriptCreated }: WhisperTranscriberProps) => {
  const {
    file,
    isLoading,
    error,
    progress,
    modelLoading,
    modelLoadProgress,
    availableModels,
    selectedModel,
    handleFileSelected,
    transcribeAudioFile,
    selectModel,
    cancelTranscription
  } = useWhisperTranscription(onTranscriptCreated);

  const [modelAvailability, setModelAvailability] = useState<Record<string, boolean>>({});
  const [deviceInfo, setDeviceInfo] = useState<{ isWebGPU: boolean }>({ isWebGPU: false });

  // Calculate estimated file size in MB
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : "0";

  // Check model availability and device capabilities on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const availability: Record<string, boolean> = {};
      
      for (const model of availableModels) {
        availability[model] = await checkModelAvailability(model);
      }
      
      setModelAvailability(availability);
    };
    
    const checkDeviceCapabilities = async () => {
      const hasWebGPU = typeof navigator !== 'undefined' && 
                       'gpu' in navigator && 
                       await (navigator as any).gpu?.requestAdapter() !== null;
                       
      setDeviceInfo({ isWebGPU: hasWebGPU });
    };
    
    checkAvailability();
    checkDeviceCapabilities();
  }, [availableModels]);

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <CardTitle>Audio Transcription with Whisper</CardTitle>
        <CardDescription>Upload an audio file to create a transcript</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <FileSelector 
          onFileSelected={handleFileSelected}
          isLoading={isLoading}
        />
        
        <div className="space-y-2">
          <WhisperModelSelector 
            availableModels={availableModels}
            selectedModel={selectedModel}
            onModelSelect={selectModel}
            disabled={isLoading}
          />
          
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              {deviceInfo.isWebGPU ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-green-600">
                        <HardDrive className="h-3 w-3 mr-1" />
                        WebGPU available
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Using GPU acceleration for faster transcription</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-amber-600">
                        <Cpu className="h-3 w-3 mr-1" />
                        CPU only
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>WebGPU not available - transcription may be slower</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <div>
              {modelAvailability[selectedModel] ? (
                <span className="text-green-600">Model cached ({getModelSize(selectedModel)}MB)</span>
              ) : (
                <span className="text-slate-500">Needs download ({getModelSize(selectedModel)}MB)</span>
              )}
            </div>
          </div>
        </div>
        
        {modelLoading && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
            <h4 className="font-semibold mb-1">Downloading Whisper Model</h4>
            <p className="mb-2">The Whisper model is downloading. This only happens the first time you use each model.</p>
            <ProgressIndicator 
              progress={modelLoadProgress} 
              isVisible={true}
              label="Downloading model..."
            />
          </div>
        )}
        
        <ProgressIndicator 
          progress={progress} 
          isVisible={isLoading && !modelLoading}
          label="Transcribing audio..."
        />
        
        <ErrorDisplay error={error} />
        
        <Button 
          className="w-full" 
          onClick={transcribeAudioFile} 
          disabled={!file || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {modelLoading 
                ? `Downloading model (${modelLoadProgress}%)`
                : `Transcribing (${progress}%)`}
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Transcribe with Whisper
            </>
          )}
        </Button>
        
        {isLoading && (
          <Button 
            variant="outline" 
            className="w-full mt-2" 
            onClick={cancelTranscription}
          >
            <X className="mr-2 h-4 w-4" />
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

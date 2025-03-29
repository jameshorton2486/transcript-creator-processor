
import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mic, FileAudio, AlertCircle, Upload, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { validateAudioFile } from "@/lib/audio/audioValidation";

interface FileSelectorProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  supportedFormats?: string[];
  maxSizeMB?: number;
  className?: string;
}

/**
 * FileSelector Component
 * 
 * A simpler file selector component for audio/video uploads without drag-and-drop functionality
 */
export const FileSelector: React.FC<FileSelectorProps> = ({ 
  onFileSelected, 
  isLoading, 
  supportedFormats = ["mp3", "wav", "flac", "m4a", "ogg", "aac"], 
  maxSizeMB = 250,
  className = ""
}: FileSelectorProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setError(null);
      
      const validationResult = validateAudioFile(selectedFile);
      
      if (!validationResult.valid) {
        setError(validationResult.reason || "Invalid file");
        toast({
          title: "File Error",
          description: validationResult.reason || "Invalid file",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      onFileSelected(selectedFile);
      console.log(`File selected: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
      
      toast({
        title: "File Selected",
        description: `${selectedFile.name} ready for transcription`,
        variant: "default"
      });
    }
  }, [onFileSelected, toast]);

  const handleButtonClick = useCallback(() => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isLoading]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("audio/")) {
      return <Mic className="h-4 w-4 text-indigo-600" />;
    } else if (mimeType.includes("video/")) {
      return <FileAudio className="h-4 w-4 text-indigo-600" />;
    } else {
      return <FileAudio className="h-4 w-4 text-indigo-600" />;
    }
  };

  // Format the supported formats string
  const formatSupported = supportedFormats.map(format => format.toUpperCase()).join(', ');

  return (
    <div className={className}>
      <div className="flex flex-col items-center p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/80 hover:bg-slate-50 transition-colors">
        <Upload className="h-10 w-10 text-indigo-500 mb-3" />
        <p className="text-sm text-slate-700 mb-2 font-medium">Upload an audio or video file for transcription</p>
        <p className="text-xs text-slate-500 mb-4 text-center max-w-md">
          Select a file from your device to create a transcript
        </p>
        <input
          type="file"
          id="audio-file"
          ref={fileInputRef}
          accept="audio/*,video/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <Button
          onClick={handleButtonClick}
          className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          disabled={isLoading}
        >
          <FileAudio className="h-4 w-4" />
          Select Audio File
        </Button>
        
        <div className="flex items-center mt-4">
          <p className="text-xs text-slate-500">
            Supports {formatSupported} and most audio/video formats
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-1">
                <Info className="h-3.5 w-3.5 text-slate-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                Recommended for best results: WAV or MP3 files under {maxSizeMB}MB with clear audio.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {file && !error && (
        <div className="p-4 mt-4 bg-white rounded-md border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-700 flex items-center mb-1">
            {getFileIcon(file.type)}
            <span className="ml-2">Selected file:</span>
          </p>
          <p className="text-sm text-slate-800 font-medium truncate">{file.name}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-500">
              {file.type || 'audio/video file'}
            </p>
            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-medium">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

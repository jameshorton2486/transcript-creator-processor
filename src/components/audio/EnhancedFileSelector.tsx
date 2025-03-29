
import React, { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileAudio, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validateAudioFile } from "@/lib/audio/audioValidation";

interface FileSelectorProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  supportedFormats?: string[];
  maxSizeMB?: number;
  className?: string;
}

/**
 * EnhancedFileSelector Component
 * 
 * A reusable component that handles file selection for audio files, with
 * drag and drop support and file validation.
 */
export const EnhancedFileSelector: React.FC<FileSelectorProps> = ({
  onFileSelected,
  isLoading = false,
  supportedFormats = ["mp3", "wav", "m4a", "mp4", "flac", "ogg", "aac", "mov", "webm"],
  maxSizeMB = 250,
  className = ""
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Format extensions for display and validation
  const formattedFormats = supportedFormats.map(f => f.toLowerCase().replace(".", ""));
  const formatString = formattedFormats.join(", ");
  
  /**
   * Validates the selected file
   * @param file - The file to validate
   * @returns true if the file is valid, false otherwise
   */
  const validateFile = useCallback((file: File): boolean => {
    // Reset previous errors
    setError(null);
    
    const validationResult = validateAudioFile(file);
    
    if (!validationResult.valid) {
      setError(validationResult.reason || "Invalid file");
      toast({
        title: "File Error",
        description: validationResult.reason || "Invalid file",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  }, [toast]);

  /**
   * Handles the file selection from input or drop event
   */
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        console.log(`Selected file: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        onFileSelected(file);
        toast({
          title: "File Selected",
          description: `${file.name} ready for transcription`,
          variant: "default"
        });
      }
    }
  }, [validateFile, onFileSelected, toast]);

  /**
   * Handles the click on the file selector button
   */
  const handleClick = useCallback(() => {
    if (fileInputRef.current && !isLoading) {
      fileInputRef.current.click();
    }
  }, [isLoading]);

  /**
   * Prevents default drag behavior
   */
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  /**
   * Handles the drop event
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !isLoading) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        console.log(`Dropped file: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        onFileSelected(file);
        toast({
          title: "File Selected",
          description: `${file.name} ready for transcription`,
          variant: "default"
        });
      }
    }
  }, [isLoading, validateFile, onFileSelected, toast]);

  /**
   * Get the file icon based on its type
   */
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("audio/")) {
      return <FileAudio className="h-4 w-4 text-primary" />;
    } else if (mimeType.includes("video/")) {
      return <FileAudio className="h-4 w-4 text-primary" />;
    } else {
      return <FileAudio className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Select audio file"
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="audio/*,video/*"
          onChange={handleFileChange}
          disabled={isLoading}
          aria-label="File input"
        />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className={`p-3 rounded-full ${dragActive ? 'bg-primary/20' : 'bg-slate-100'}`}>
            {dragActive ? (
              <FileAudio className="h-6 w-6 text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-slate-600" />
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {dragActive 
                ? "Drop audio or video file here" 
                : "Drag and drop audio or video file or click to browse"
              }
            </p>
            <p className="text-xs text-slate-500">
              Supported formats: {formatString.toUpperCase()}
            </p>
            <p className="text-xs text-slate-500">
              Maximum file size: {maxSizeMB}MB
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="flex items-center text-red-500 text-sm space-x-2 p-3 bg-red-50 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedFile && !error && (
        <div className="p-4 bg-white rounded-md border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-700 flex items-center mb-1">
            {getFileIcon(selectedFile.type)}
            <span className="ml-2">Selected file:</span>
          </p>
          <p className="text-sm text-slate-800 font-medium truncate">{selectedFile.name}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-500">
              {selectedFile.type || 'audio/video file'}
            </p>
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { FileAudio, Upload, X, FileIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AudioFileValidator } from './AudioFileValidator';

interface EnhancedFileSelectorProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  maxSizeMB?: number;
  supportedFormats?: string[];
  showFileInfo?: boolean;
}

export const EnhancedFileSelector = ({
  onFileSelected,
  isLoading,
  maxSizeMB = 250,
  supportedFormats = ["mp3", "wav", "m4a", "flac", "ogg"],
  showFileInfo = true
}: EnhancedFileSelectorProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((file: File | null) => {
    setError(null);
    
    if (!file) {
      setSelectedFile(null);
      return;
    }
    
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds the ${maxSizeMB}MB limit`);
      return;
    }
    
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!supportedFormats.includes(fileExtension)) {
      setError(`Unsupported file format. Please use: ${supportedFormats.join(', ')}`);
      return;
    }
    
    setSelectedFile(file);
    onFileSelected(file);
  }, [maxSizeMB, onFileSelected, supportedFormats]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0] || null;
    handleFileChange(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isLoading ? undefined : handleButtonClick}
      >
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <FileAudio className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col space-y-1">
            <h3 className="text-sm font-medium">
              {selectedFile ? 'File selected' : 'Select audio file'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {selectedFile 
                ? selectedFile.name 
                : `Drag and drop or click to browse (Max: ${maxSizeMB}MB)`}
            </p>
          </div>
          {!selectedFile && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          )}
          {selectedFile && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                handleClearFile();
              }}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Selection
            </Button>
          )}
        </div>
      </div>
      
      {/* Add the audio file validator */}
      {selectedFile && <AudioFileValidator file={selectedFile} />}
      
      {error && (
        <div className="flex items-center text-destructive text-sm mt-2">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      {isLoading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing...</span>
            <span className="text-muted-foreground">Please wait</span>
          </div>
          <Progress value={33} className="h-2" />
        </div>
      )}
      
      {selectedFile && showFileInfo && !error && (
        <div className="bg-muted/50 rounded-md p-3 flex items-center">
          <FileIcon className="h-5 w-5 mr-2 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)} • {selectedFile.type || `${selectedFile.name.split('.').pop()} file`}
            </p>
          </div>
        </div>
      )}
      
      <Input
        ref={fileInputRef}
        type="file"
        accept={supportedFormats.map(format => `.${format}`).join(',')}
        className="hidden"
        onChange={handleInputChange}
        disabled={isLoading}
      />
    </div>
  );
};

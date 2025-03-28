
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileAudio, AlertCircle } from "lucide-react";

interface FileSelectorProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  supportedFormats?: string[];
  maxSizeMB?: number;
}

/**
 * FileSelector Component
 * 
 * A reusable component that handles file selection for audio files, with
 * drag and drop support and file validation.
 */
export const EnhancedFileSelector: React.FC<FileSelectorProps> = ({
  onFileSelected,
  isLoading = false,
  supportedFormats = ["mp3", "wav", "m4a", "mp4", "flac"],
  maxSizeMB = 250
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format extensions for display and validation
  const formattedFormats = supportedFormats.map(f => f.toLowerCase().replace(".", ""));
  const formatString = formattedFormats.join(", ");
  
  /**
   * Validates the selected file
   * @param file - The file to validate
   * @returns true if the file is valid, false otherwise
   */
  const validateFile = (file: File): boolean => {
    // Reset previous errors
    setError(null);
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File too large: Maximum size is ${maxSizeMB}MB`);
      return false;
    }
    
    // Check file format
    const extension = file.name.split('.').pop()?.toLowerCase() || "";
    if (!formattedFormats.includes(extension)) {
      setError(`Unsupported file type: Only ${formatString} are supported`);
      return false;
    }
    
    return true;
  };

  /**
   * Handles the file selection from input or drop event
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  /**
   * Handles the click on the file selector button
   */
  const handleClick = () => {
    if (fileInputRef.current && !isLoading) {
      fileInputRef.current.click();
    }
  };

  /**
   * Prevents default drag behavior
   */
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  /**
   * Handles the drop event
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !isLoading) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center 
          ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transition-colors'}
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
          accept={formattedFormats.map(ext => `.${ext}`).join(",")}
          onChange={handleFileChange}
          disabled={isLoading}
          aria-label="File input"
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className={`p-3 rounded-full ${dragActive ? 'bg-primary/20' : 'bg-slate-100'}`}>
            {dragActive ? (
              <FileAudio className="h-6 w-6 text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-slate-600" />
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {dragActive 
                ? "Drop audio file here" 
                : "Drag and drop audio file or click to browse"
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
        <div className="flex items-center text-red-500 text-sm space-x-1 p-2 bg-red-50 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

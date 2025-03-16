
import { useState, useRef } from "react";
import { FileUp, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileUploaderProps {
  onFileChange: (files: File[]) => void;
  files: File[];
  acceptedFileTypes?: string;
  multiple?: boolean;
}

export const FileUploader = ({
  onFileChange,
  files,
  acceptedFileTypes = ".docx,.txt,.pdf",
  multiple = false,
}: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      if (multiple) {
        onFileChange([...files, ...newFiles]);
      } else {
        onFileChange([newFiles[0]]);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (multiple) {
        onFileChange([...files, ...newFiles]);
      } else {
        onFileChange([newFiles[0]]);
      }
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    onFileChange(updatedFiles);
  };

  const clearAllFiles = () => {
    onFileChange([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Get readable file type for display
  const getFileTypeDisplay = (file: File): string => {
    if (file.type === "application/pdf") {
      return "PDF Document";
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return "Word Document (.docx)";
    } else if (file.type === "application/msword") {
      return "Word Document (.doc)";
    } else if (file.type === "text/plain") {
      return "Text File";
    } else {
      return file.type || "Unknown file type";
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center",
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
          files.length > 0 ? "bg-gray-50" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {files.length > 0 ? (
          <div className="flex flex-col items-center">
            <File className="h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              {files.length} {files.length === 1 ? "file" : "files"} selected
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFiles}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Remove All Files
            </Button>
          </div>
        ) : (
          <>
            <FileUp className="h-10 w-10 text-slate-400 mb-2" />
            <p className="font-medium text-slate-600 mb-1">
              Drag and drop your document {multiple ? "files" : "file"}
            </p>
            <p className="text-sm text-slate-500 mb-3">
              or click to browse files
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Select {multiple ? "Files" : "File"}
            </Button>
          </>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileInput}
        accept={acceptedFileTypes}
        multiple={multiple}
      />

      {files.length > 0 && (
        <ScrollArea className="h-48 rounded-md border">
          <div className="p-4 space-y-2">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`} 
                className="flex justify-between items-center p-2 bg-slate-100 rounded-md"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {getFileTypeDisplay(file)} • {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};


import { useState, useRef } from "react";
import { FileUp, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onFileChange: (file: File | null) => void;
  file: File | null;
  acceptedFileTypes?: string;
}

export const FileUploader = ({
  onFileChange,
  file,
  acceptedFileTypes = ".docx,.txt",
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
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };

  const clearFile = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center",
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
          file ? "bg-gray-50" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex flex-col items-center">
            <File className="h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-700 mb-1">{file.name}</p>
            <p className="text-xs text-slate-500 mb-3">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFile}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Remove File
            </Button>
          </div>
        ) : (
          <>
            <FileUp className="h-10 w-10 text-slate-400 mb-2" />
            <p className="font-medium text-slate-600 mb-1">
              Drag and drop your transcript file
            </p>
            <p className="text-sm text-slate-500 mb-3">
              or click to browse files
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
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
      />

      {file && (
        <div className="p-3 bg-slate-100 rounded-md">
          <p className="text-xs text-slate-600">
            <span className="font-medium">File info: </span>
            {file.type || "Unknown type"} • Last modified:{" "}
            {new Date(file.lastModified).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

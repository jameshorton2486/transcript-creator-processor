
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Mic, FileAudio, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FileSelectorProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export const FileSelector = ({ onFileSelected, isLoading }: FileSelectorProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setError(null);
      
      if (selectedFile.type.startsWith("audio/") || selectedFile.type.startsWith("video/")) {
        setFile(selectedFile);
        onFileSelected(selectedFile);
        console.log(`File selected: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        setError("Invalid file type. Please select an audio or video file.");
        toast({
          title: "Invalid file type",
          description: "Please select an audio or video file.",
          variant: "destructive",
        });
      }
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("audio/")) {
      return <Mic className="h-4 w-4" />;
    } else if (mimeType.includes("video/")) {
      return <FileAudio className="h-4 w-4" />;
    } else {
      return <FileAudio className="h-4 w-4" />;
    }
  };

  return (
    <>
      <div className="flex flex-col items-center p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
        <FileAudio className="h-10 w-10 text-slate-400 mb-2" />
        <p className="text-sm text-slate-500 mb-2">Upload an audio or video file for transcription</p>
        <input
          type="file"
          id="audio-file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <label
          htmlFor="audio-file"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 cursor-pointer"
        >
          <Mic className="h-4 w-4" />
          Select Audio File
        </label>
        <p className="text-xs text-slate-400 mt-2">
          Supports MP3, WAV, FLAC, M4A and most audio/video formats
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {file && (
        <div className="p-3 bg-slate-50 rounded-md">
          <p className="text-sm font-medium text-slate-700 flex items-center">
            {getFileIcon(file.type)}
            <span className="ml-2">Selected file:</span>
          </p>
          <p className="text-sm text-slate-500 truncate">{file.name}</p>
          <p className="text-xs text-slate-400">
            {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}
    </>
  );
};

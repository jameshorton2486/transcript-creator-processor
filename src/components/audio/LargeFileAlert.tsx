
import { AlertCircle, Volume2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LargeFileAlertProps {
  isVisible: boolean;
  fileSizeMB: string;
}

export const LargeFileAlert = ({ isVisible, fileSizeMB }: LargeFileAlertProps) => {
  if (!isVisible) return null;
  
  return (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Large File Processing</AlertTitle>
      <AlertDescription className="text-amber-800">
        <p>This {fileSizeMB} MB file will be automatically processed in small batches to avoid memory issues.</p>
        <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
          <li>Audio will be split into optimal segments for legal transcription</li>
          <li>Each segment will be processed separately and then combined</li>
          <li>This approach reduces memory usage and prevents browser crashes</li>
          <li>Files up to 200MB are supported with batch processing</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
};


import { AlertCircle } from "lucide-react";
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
        This {fileSizeMB} MB file exceeds the direct processing limit. 
        It will be automatically processed in batches with optimized segments for legal transcription.
        Files up to 200MB are supported.
      </AlertDescription>
    </Alert>
  );
};

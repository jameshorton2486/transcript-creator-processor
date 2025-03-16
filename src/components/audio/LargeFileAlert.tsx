
import { Alert, AlertCircle, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LargeFileAlertProps {
  isVisible: boolean;
  fileSizeMB: string;
}

export const LargeFileAlert = ({ isVisible, fileSizeMB }: LargeFileAlertProps) => {
  if (!isVisible) return null;
  
  return (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Large File Detected</AlertTitle>
      <AlertDescription className="text-amber-800">
        This {fileSizeMB} MB file exceeds the 10MB limit for direct API processing. 
        It will be automatically processed in batches. This may take several minutes.
      </AlertDescription>
    </Alert>
  );
};

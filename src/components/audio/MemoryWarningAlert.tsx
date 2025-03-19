
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface MemoryWarningAlertProps {
  warningMessage: string | null;
}

export const MemoryWarningAlert = ({ warningMessage }: MemoryWarningAlertProps) => {
  if (!warningMessage) return null;
  
  return (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-700">Memory Usage Warning</AlertTitle>
      <AlertDescription className="text-amber-600">{warningMessage}</AlertDescription>
    </Alert>
  );
};

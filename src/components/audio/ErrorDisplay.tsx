
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorDisplayProps {
  error: string | null;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};

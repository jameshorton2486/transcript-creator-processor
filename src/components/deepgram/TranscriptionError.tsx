
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TranscriptionErrorProps {
  error: string | null;
}

export const TranscriptionError: React.FC<TranscriptionErrorProps> = ({
  error
}) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Transcription Failed</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};

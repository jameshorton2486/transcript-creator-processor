
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileWarning } from 'lucide-react';
import { validateAudioFile } from '@/lib/deepgram/deepgramService';

interface AudioFileValidatorProps {
  file: File | null;
}

export const AudioFileValidator: React.FC<AudioFileValidatorProps> = ({ file }) => {
  const [validation, setValidation] = React.useState<{ valid: boolean; message?: string } | null>(null);

  React.useEffect(() => {
    if (file) {
      setValidation(validateAudioFile(file));
    } else {
      setValidation(null);
    }
  }, [file]);

  if (!file || !validation || validation.valid) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <FileWarning className="h-4 w-4" />
        File Validation Error
      </AlertTitle>
      <AlertDescription>
        {validation.message || 'This file cannot be processed by Deepgram. Please select a different file.'}
        
        <div className="mt-2 text-xs bg-red-50 p-2 rounded border border-red-200">
          <strong>Supported formats:</strong> mp3, wav, ogg, flac, m4a, aac, mp4, mov
          <br />
          <strong>Max file size:</strong> 250MB
        </div>
      </AlertDescription>
    </Alert>
  );
};


import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AudioFileValidatorProps {
  file: File;
}

export const AudioFileValidator: React.FC<AudioFileValidatorProps> = ({ file }) => {
  const [validationResult, setValidationResult] = useState<{
    status: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const validateAudioFile = async () => {
      // Check file size
      if (file.size > 100 * 1024 * 1024) {
        setValidationResult({
          status: 'error',
          message: 'File is too large (>100MB). Transcription may fail or take a long time.'
        });
        return;
      }
      
      // Check if the file type is supported
      const supportedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/mp4', 'audio/x-m4a', 'audio/flac', 'audio/ogg'];
      
      if (!supportedTypes.includes(file.type)) {
        // Check extension as fallback
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!['mp3', 'wav', 'm4a', 'mp4', 'flac', 'ogg'].includes(extension || '')) {
          setValidationResult({
            status: 'warning',
            message: 'File type may not be supported. For best results, use MP3, WAV, M4A, FLAC, or OGG.'
          });
          return;
        }
      }
      
      // File seems good
      setValidationResult({
        status: 'success',
        message: 'Audio file looks good for transcription.'
      });
    };

    validateAudioFile();
  }, [file]);

  if (!validationResult) return null;

  return (
    <Alert variant={validationResult.status === 'error' ? "destructive" : "default"} 
           className={validationResult.status === 'success' ? "bg-green-50 text-green-800 border-green-200" : 
                      validationResult.status === 'warning' ? "bg-yellow-50 text-yellow-800 border-yellow-200" : 
                      "bg-red-50 text-red-800 border-red-200"}>
      <div className="flex items-center">
        {validationResult.status === 'success' ? (
          <CheckCircle className="h-4 w-4 mr-2" />
        ) : validationResult.status === 'warning' ? (
          <AlertTriangle className="h-4 w-4 mr-2" />
        ) : (
          <AlertCircle className="h-4 w-4 mr-2" />
        )}
        <AlertDescription>{validationResult.message}</AlertDescription>
      </div>
    </Alert>
  );
};

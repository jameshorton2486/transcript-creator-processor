
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Loader2, FileAudio } from 'lucide-react';

interface TranscriptionControlsProps {
  handleTranscribe: () => Promise<void>;
  resetTranscription: () => void;
  selectedFile: File | null;
  isTranscribing: boolean;
  isApiKeyValid: boolean;
  hasTranscription: boolean;
}

export const TranscriptionControlsFooter: React.FC<TranscriptionControlsProps> = ({
  handleTranscribe,
  resetTranscription,
  selectedFile,
  isTranscribing,
  isApiKeyValid,
  hasTranscription
}) => {
  return (
    <CardFooter className="flex justify-between">
      <Button 
        variant="outline" 
        onClick={resetTranscription}
        disabled={!hasTranscription}
      >
        Reset
      </Button>
      <Button
        onClick={handleTranscribe}
        disabled={!selectedFile || isTranscribing || !isApiKeyValid}
        className="gap-2"
      >
        {isTranscribing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Transcribing...
          </>
        ) : (
          <>
            <FileAudio className="h-4 w-4" />
            Transcribe
          </>
        )}
      </Button>
    </CardFooter>
  );
};

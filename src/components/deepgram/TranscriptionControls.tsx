
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Loader2, FileAudio, RefreshCw } from 'lucide-react';

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
    <CardFooter className="flex justify-between pt-6 border-t">
      <Button 
        variant="outline" 
        onClick={resetTranscription}
        disabled={!hasTranscription}
        className="flex gap-2 transition-all duration-200 hover:bg-red-50"
      >
        <RefreshCw className={`h-4 w-4 ${hasTranscription ? 'text-red-500' : 'text-gray-400'}`} />
        Reset
      </Button>
      <Button
        onClick={handleTranscribe}
        disabled={!selectedFile || isTranscribing || !isApiKeyValid}
        className={`gap-2 px-6 py-2 transition-all duration-200 shadow-md hover:shadow-lg 
          ${!selectedFile || !isApiKeyValid ? 'opacity-70' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        size="lg"
      >
        {isTranscribing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="animate-pulse">Transcribing...</span>
          </>
        ) : (
          <>
            <FileAudio className="h-5 w-5" />
            Transcribe Audio
          </>
        )}
      </Button>
    </CardFooter>
  );
};

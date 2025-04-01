
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Loader2, X, Play } from "lucide-react";

interface TranscriptionControlsFooterProps {
  handleTranscribe: () => void;
  resetTranscription: () => void;
  selectedFile: File | null;
  isTranscribing: boolean;
  isApiKeyValid: boolean;
  hasTranscription: boolean;
}

export const TranscriptionControlsFooter: React.FC<TranscriptionControlsFooterProps> = ({
  handleTranscribe,
  resetTranscription,
  selectedFile,
  isTranscribing,
  isApiKeyValid,
  hasTranscription
}) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleTranscribe}
          disabled={!selectedFile || isTranscribing || !isApiKeyValid}
          className="flex-1 min-w-[140px]"
        >
          {isTranscribing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Transcribing...
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              {hasTranscription ? "Retranscribe" : "Transcribe Audio"}
            </>
          )}
        </Button>

        {isTranscribing && (
          <Button 
            variant="outline" 
            onClick={resetTranscription}
            className="flex-1 min-w-[140px]"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
        
        {hasTranscription && !isTranscribing && (
          <Button 
            variant="outline" 
            onClick={resetTranscription}
            className="flex-1 min-w-[140px]"
          >
            <Play className="h-4 w-4 mr-2" />
            Start New Transcription
          </Button>
        )}
      </div>
    </div>
  );
};

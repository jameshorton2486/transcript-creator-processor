
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic, X, Clock } from "lucide-react";
import { EnhancedProgressIndicator } from "@/components/audio/EnhancedProgressIndicator";
import { AlertCircle } from "lucide-react";

interface TranscriptionControlsProps {
  handleTranscribe: () => Promise<void>;
  cancelTranscription: () => void;
  file: File | null;
  isLoading: boolean;
  keyStatus: 'untested' | 'valid' | 'invalid';
  error: string | null;
  progress: number;
  estimatedTimeRemaining?: string;
}

export const TranscriptionControls: React.FC<TranscriptionControlsProps> = ({
  handleTranscribe,
  cancelTranscription,
  file,
  isLoading,
  keyStatus,
  error,
  progress,
  estimatedTimeRemaining
}) => {
  return (
    <>
      <div className="flex flex-wrap gap-4 items-center">
        <Button
          onClick={handleTranscribe}
          disabled={!file || isLoading || keyStatus !== 'valid'}
          className="gap-2"
        >
          {isLoading ? (
            <span className="flex items-center">
              <Mic className="h-4 w-4 mr-2 animate-pulse" />
              Transcribing...
            </span>
          ) : (
            <span className="flex items-center">
              <Mic className="h-4 w-4 mr-2" />
              Start Transcription
            </span>
          )}
        </Button>

        {isLoading && (
          <Button variant="outline" onClick={cancelTranscription} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
        
        {estimatedTimeRemaining && (
          <span className="text-xs text-slate-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {estimatedTimeRemaining}
          </span>
        )}
      </div>

      {isLoading && (
        <EnhancedProgressIndicator
          progress={progress}
          isVisible={true}
          label="Transcribing audio..."
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </>
  );
};

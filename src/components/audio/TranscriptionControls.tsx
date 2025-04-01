
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic, StopCircle } from "lucide-react";

interface TranscriptionControlsProps {
  onStartTranscribe: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  isDisabled: boolean;
}

export const TranscriptionControls: React.FC<TranscriptionControlsProps> = ({
  onStartTranscribe,
  onCancel,
  isProcessing,
  isDisabled
}) => {
  return (
    <div className="pt-2 flex space-x-2">
      <Button 
        onClick={onStartTranscribe} 
        disabled={isDisabled}
        className="flex-1"
      >
        {isProcessing ? (
          <span className="flex items-center">
            <Mic className="mr-2 h-4 w-4 animate-pulse" />
            Transcribing...
          </span>
        ) : (
          <span className="flex items-center">
            <Mic className="mr-2 h-4 w-4" />
            Start Transcription
          </span>
        )}
      </Button>
      
      {isProcessing && (
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          <StopCircle className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      )}
    </div>
  );
};

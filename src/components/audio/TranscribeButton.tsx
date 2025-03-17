
import { Button } from "@/components/ui/button";
import { Loader2, Mic } from "lucide-react";

interface TranscribeButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isLoading: boolean;
  isBatchProcessing: boolean;
  progress: number;
}

export const TranscribeButton = ({ 
  onClick, 
  isDisabled, 
  isLoading, 
  isBatchProcessing, 
  progress 
}: TranscribeButtonProps) => {
  return (
    <Button 
      className="w-full" 
      onClick={onClick} 
      disabled={isDisabled}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isBatchProcessing 
            ? `Processing in batches (${progress}%)`
            : "Transcribing..."}
        </>
      ) : (
        <>
          <Mic className="mr-2 h-4 w-4" />
          Transcribe Audio
        </>
      )}
    </Button>
  );
};

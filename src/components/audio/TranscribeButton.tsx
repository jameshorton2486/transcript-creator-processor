
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
  // Ensure progress is capped between 0 and 100
  const normalizedProgress = Math.min(Math.max(Math.round(progress), 0), 100);
  
  return (
    <Button 
      className="w-full" 
      onClick={onClick} 
      disabled={isDisabled}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isBatchProcessing && normalizedProgress > 0 && normalizedProgress < 100 
            ? `Processing audio (${normalizedProgress}%)`
            : "Processing audio..."}
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

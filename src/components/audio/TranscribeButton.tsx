
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
      className={`w-full transition-all duration-200 ${isLoading ? 'bg-indigo-600' : 'bg-indigo-500 hover:bg-indigo-600'} shadow-md hover:shadow-lg relative overflow-hidden`}
      onClick={onClick} 
      disabled={isDisabled}
      size="lg"
    >
      {isLoading && (
        <div 
          className="absolute left-0 top-0 h-full bg-indigo-700 opacity-50 z-0 transition-all"
          style={{ 
            width: isBatchProcessing ? `${normalizedProgress}%` : '100%',
            animation: !isBatchProcessing ? 'pulse 2s infinite' : 'none'
          }}
        />
      )}
      
      <div className="relative z-10 flex items-center justify-center font-medium">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {isBatchProcessing && normalizedProgress > 0 && normalizedProgress < 100 
              ? `Processing (${normalizedProgress}%)`
              : "Processing..."}
          </>
        ) : (
          <>
            <Mic className="mr-2 h-5 w-5" />
            Transcribe Audio
          </>
        )}
      </div>
    </Button>
  );
};

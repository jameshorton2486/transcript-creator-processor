
import { AudioTranscriber } from "@/components/AudioTranscriber";
import { TranscriptProcessor } from "@/components/TranscriptProcessor";
import { TranscriptReviewer } from "@/components/TranscriptReviewer";
import { ClearTranscriptButton } from "@/components/transcript/ClearTranscriptButton";

interface TranscriptControlsProps {
  originalTranscript: string;
  processedTranscript: string;
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void;
  onTranscriptProcessed: (processedText: string) => void;
  onAiReviewCompleted: (reviewedText: string) => void;
  onClearWorkspace: () => void;
  isReviewing: boolean;
  setIsReviewing: (isReviewing: boolean) => void;
}

export const TranscriptControls = ({
  originalTranscript,
  processedTranscript,
  onTranscriptCreated,
  onTranscriptProcessed,
  onAiReviewCompleted,
  onClearWorkspace,
  isReviewing,
  setIsReviewing,
}: TranscriptControlsProps) => {
  const hasTranscript = originalTranscript || processedTranscript;
  
  return (
    <div className="h-full flex flex-col space-y-6">
      <AudioTranscriber 
        onTranscriptCreated={onTranscriptCreated} 
      />
      
      {originalTranscript && (
        <TranscriptProcessor 
          transcript={originalTranscript} 
          onProcessed={onTranscriptProcessed} 
        />
      )}
      
      {hasTranscript && (
        <TranscriptReviewer
          transcript={processedTranscript || originalTranscript}
          onReviewComplete={onAiReviewCompleted}
          isLoading={isReviewing}
          setIsLoading={setIsReviewing}
        />
      )}
      
      {hasTranscript && (
        <ClearTranscriptButton onClear={onClearWorkspace} />
      )}
    </div>
  );
};

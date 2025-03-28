
import DeepgramTranscriber from "@/components/DeepgramTranscriber";
import { TranscriptProcessor } from "@/components/TranscriptProcessor";
import { TranscriptReviewer } from "@/components/TranscriptReviewer";
import { ClearTranscriptButton } from "@/components/transcript/ClearTranscriptButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioLines, Wand2, Sparkles } from "lucide-react";

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
    <div className="h-full flex flex-col space-y-5">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-2 bg-slate-50 border-b">
          <CardTitle className="text-base flex items-center text-slate-800">
            <AudioLines className="h-4 w-4 mr-2 text-indigo-600" />
            Audio Transcription
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <DeepgramTranscriber 
            onTranscriptionComplete={(result) => onTranscriptCreated(result.transcript, result.rawResponse, null)}
          />
        </CardContent>
      </Card>
      
      {originalTranscript && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 bg-slate-50 border-b">
            <CardTitle className="text-base flex items-center text-slate-800">
              <Wand2 className="h-4 w-4 mr-2 text-emerald-600" />
              Process Transcript
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <TranscriptProcessor 
              transcript={originalTranscript} 
              onProcessed={onTranscriptProcessed} 
            />
          </CardContent>
        </Card>
      )}
      
      {hasTranscript && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2 bg-slate-50 border-b">
            <CardTitle className="text-base flex items-center text-slate-800">
              <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
              AI Review
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <TranscriptReviewer
              transcript={processedTranscript || originalTranscript}
              onReviewComplete={onAiReviewCompleted}
              isLoading={isReviewing}
              setIsLoading={setIsReviewing}
            />
          </CardContent>
        </Card>
      )}
      
      {hasTranscript && (
        <div className="mt-auto pt-4">
          <ClearTranscriptButton onClear={onClearWorkspace} />
        </div>
      )}
    </div>
  );
};

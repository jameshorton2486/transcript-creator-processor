
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { TranscriptControls } from "@/components/transcript/TranscriptControls";
import { TranscriptViewerPanel } from "@/components/transcript/TranscriptViewerPanel";

interface TranscribeTabProps {
  originalTranscript: string;
  processedTranscript: string;
  aiReviewedTranscript: string;
  jsonData: any;
  fileName: string;
  setOriginalTranscript: (transcript: string) => void;
  setProcessedTranscript: (transcript: string) => void;
  setAiReviewedTranscript: (transcript: string) => void;
  setJsonData: (data: any) => void;
  setFileName: (name: string) => void;
  setAudioFile: (file: File | null) => void;
  isReviewing: boolean;
  setIsReviewing: (isReviewing: boolean) => void;
}

export const TranscribeTab = ({
  originalTranscript,
  processedTranscript,
  aiReviewedTranscript,
  jsonData,
  fileName,
  setOriginalTranscript,
  setProcessedTranscript,
  setAiReviewedTranscript,
  setJsonData,
  setFileName,
  setAudioFile,
  isReviewing,
  setIsReviewing,
}: TranscribeTabProps) => {
  const { toast } = useToast();
  
  // Add console log to debug transcript values in the main tab
  console.log("TranscribeTab state:", {
    originalLength: originalTranscript?.length,
    processedLength: processedTranscript?.length, 
    aiReviewedLength: aiReviewedTranscript?.length,
    fileName,
    hasJsonData: Boolean(jsonData)
  });
  
  const handleTranscriptCreated = (transcript: string, jsonData: any, file?: File) => {
    console.log("Transcript created:", { 
      transcriptLength: transcript?.length, 
      hasJsonData: Boolean(jsonData),
      fileProvided: Boolean(file)
    });
    
    setOriginalTranscript(transcript);
    setJsonData(jsonData);
    if (file) {
      setAudioFile(file);
      setFileName(file.name.split('.')[0]);
    }
  };
  
  const handleTranscriptProcessed = (processedText: string) => {
    console.log("Transcript processed:", { processedLength: processedText?.length });
    setProcessedTranscript(processedText);
  };
  
  const handleAiReviewCompleted = (reviewedText: string) => {
    console.log("AI review completed:", { reviewedLength: reviewedText?.length });
    setAiReviewedTranscript(reviewedText);
    toast({
      title: "AI Review Complete",
      description: "The transcript has been reviewed and improved.",
    });
  };

  const clearWorkspace = () => {
    console.log("Clearing workspace");
    setOriginalTranscript("");
    setProcessedTranscript("");
    setAiReviewedTranscript("");
    setJsonData(null);
    setAudioFile(null);
    setFileName("transcript");
    toast({
      title: "Workspace Cleared",
      description: "All transcript data and files have been removed.",
    });
  };

  const currentTranscript = aiReviewedTranscript || processedTranscript || originalTranscript;
  console.log("Current transcript to display:", { 
    currentLength: currentTranscript?.length,
    source: aiReviewedTranscript ? "AI Reviewed" : (processedTranscript ? "Processed" : "Original")
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
      <div className="lg:col-span-5 space-y-5">
        <TranscriptControls
          originalTranscript={originalTranscript}
          processedTranscript={processedTranscript}
          onTranscriptCreated={handleTranscriptCreated}
          onTranscriptProcessed={handleTranscriptProcessed}
          onAiReviewCompleted={handleAiReviewCompleted}
          onClearWorkspace={clearWorkspace}
          isReviewing={isReviewing}
          setIsReviewing={setIsReviewing}
        />
      </div>
      
      <div className="lg:col-span-7 h-[calc(100vh-12rem)]">
        <TranscriptViewerPanel
          originalTranscript={originalTranscript}
          processedTranscript={processedTranscript}
          aiReviewedTranscript={aiReviewedTranscript}
          jsonData={jsonData}
          fileName={fileName}
          currentTranscript={currentTranscript}
        />
      </div>
    </div>
  );
};

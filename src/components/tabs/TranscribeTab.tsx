import { useState, useEffect } from "react";
import { TranscriptControls } from "@/components/transcript/TranscriptControls";
import { TranscriptViewerPanel } from "@/components/transcript/TranscriptViewerPanel";
import { TranscribeDownloadOptions } from "@/components/tabs/TranscribeDownloadOptions";
import { TranscribeDebugTools } from "@/components/tabs/TranscribeDebugTools";

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
  
  const loadSampleTranscript = () => {
    const sampleTranscript = `Speaker 1: This is a sample transcript for testing the display components.

Speaker 2: We're checking if the issue is with the transcript data flow or the display components.

Speaker 1: If this text appears correctly, then we know the display components work.

Speaker 2: Let's ensure this transcript has enough content to properly test the formatting and display capabilities.`;
    
    console.log("Setting sample transcript for testing:", {
      length: sampleTranscript.length,
      sample: sampleTranscript.substring(0, 100),
      hasContent: Boolean(sampleTranscript && sampleTranscript.trim().length > 0)
    });
    
    setOriginalTranscript(sampleTranscript);
    setProcessedTranscript(sampleTranscript);
    setFileName("sample-transcript");
  };
  
  useEffect(() => {
    console.log("TranscribeTab transcript state updated:", {
      originalLength: originalTranscript?.length, 
      originalType: typeof originalTranscript,
      originalEmpty: originalTranscript === '',
      processedLength: processedTranscript?.length, 
      aiReviewedLength: aiReviewedTranscript?.length,
      currentTranscriptLength: (aiReviewedTranscript || processedTranscript || originalTranscript)?.length
    });
  }, [originalTranscript, processedTranscript, aiReviewedTranscript]);
  
  console.log("TranscribeTab rendering with state:", {
    originalLength: originalTranscript?.length, 
    originalType: typeof originalTranscript,
    originalSample: originalTranscript?.substring(0, 100),
    processedLength: processedTranscript?.length, 
    aiReviewedLength: aiReviewedTranscript?.length,
    fileName,
    hasJsonData: Boolean(jsonData),
  });
  
  const handleTranscriptCreated = (transcript: string, jsonData: any, file?: File) => {
    console.log("Transcript created:", { 
      transcriptLength: transcript?.length, 
      transcriptSample: transcript?.substring(0, 100),
      transcriptType: typeof transcript,
      hasJsonData: Boolean(jsonData),
      fileProvided: Boolean(file)
    });
    
    if (!transcript || typeof transcript !== 'string') {
      console.error("Invalid transcript received:", transcript);
      return;
    }
    
    setOriginalTranscript(transcript);
    setJsonData(jsonData);
    if (file) {
      setAudioFile(file);
      setFileName(file.name.split('.')[0]);
    }
  };
  
  const handleTranscriptProcessed = (processedText: string) => {
    console.log("Transcript processed:", { 
      processedLength: processedText?.length,
      processedSample: processedText?.substring(0, 100)
    });
    
    if (!processedText || typeof processedText !== 'string') {
      console.error("Invalid processed transcript received:", processedText);
      return;
    }
    
    setProcessedTranscript(processedText);
  };
  
  const handleAiReviewCompleted = (reviewedText: string) => {
    console.log("AI review completed:", { 
      reviewedLength: reviewedText?.length,
      reviewedSample: reviewedText?.substring(0, 100)
    });
    
    if (!reviewedText || typeof reviewedText !== 'string') {
      console.error("Invalid AI-reviewed transcript received:", reviewedText);
      return;
    }
    
    setAiReviewedTranscript(reviewedText);
  };

  const clearWorkspace = () => {
    console.log("Clearing workspace");
    setOriginalTranscript("");
    setProcessedTranscript("");
    setAiReviewedTranscript("");
    setJsonData(null);
    setAudioFile(null);
    setFileName("transcript");
  };

  const currentTranscript = aiReviewedTranscript || processedTranscript || originalTranscript || "";
  console.log("Current transcript to display:", { 
    currentLength: currentTranscript?.length,
    currentType: typeof currentTranscript,
    isEmpty: currentTranscript === '',
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
        
        {originalTranscript ? (
          <TranscribeDownloadOptions
            originalTranscript={originalTranscript}
            currentTranscript={currentTranscript}
            fileName={fileName}
          />
        ) : (
          <TranscribeDebugTools onLoadSample={loadSampleTranscript} />
        )}
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


import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { TranscriptControls } from "@/components/transcript/TranscriptControls";
import { TranscriptViewerPanel } from "@/components/transcript/TranscriptViewerPanel";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { createWordDocument } from "@/components/transcript/docx";
import { Packer } from "docx";
import { saveAs } from "file-saver";

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
  
  // Test function to set a sample transcript for debugging
  const loadSampleTranscript = () => {
    const sampleTranscript = `Speaker 1: This is a sample transcript for testing the display components.

Speaker 2: We're checking if the issue is with the transcript data flow or the display components.

Speaker 1: If this text appears correctly, then we know the display components work.`;
    
    console.log("Setting sample transcript for testing:", {
      length: sampleTranscript.length,
      sample: sampleTranscript.substring(0, 100)
    });
    
    setOriginalTranscript(sampleTranscript);
    setFileName("sample-transcript");
    
    toast({
      title: "Sample Transcript Loaded",
      description: "A test transcript has been loaded for debugging.",
    });
  };
  
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

  const downloadWordDocument = () => {
    if (!originalTranscript) {
      toast({
        title: "No transcript available",
        description: "Please transcribe an audio file first.",
        variant: "destructive",
      });
      return;
    }
    
    const currentTranscript = aiReviewedTranscript || processedTranscript || originalTranscript;
    console.log("Downloading transcript:", {
      transcriptLength: currentTranscript.length,
      transcriptSample: currentTranscript.substring(0, 100)
    });
    
    const doc = createWordDocument(currentTranscript, fileName);
    
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `${fileName}.docx`);
      toast({
        title: "Download Complete",
        description: "Word document has been downloaded.",
      });
    }).catch(error => {
      console.error("Error creating Word document:", error);
      toast({
        title: "Download Failed",
        description: "Failed to create Word document. Please try again.",
        variant: "destructive",
      });
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
          <div className="flex flex-col gap-2 p-4 border rounded-lg bg-white shadow-sm">
            <h3 className="text-sm font-medium">Download Options</h3>
            <p className="text-xs text-gray-500 mb-2">
              Your transcript has been created and should have downloaded automatically.
              If you need to download it again, click the button below.
            </p>
            <Button 
              onClick={downloadWordDocument}
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Word Document
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-4 border rounded-lg bg-white shadow-sm">
            <h3 className="text-sm font-medium">Debugging Tools</h3>
            <p className="text-xs text-gray-500 mb-2">
              If you're having trouble with transcripts not displaying, you can load a sample transcript.
            </p>
            <Button 
              onClick={loadSampleTranscript}
              className="w-full"
              variant="outline"
            >
              Load Sample Transcript
            </Button>
          </div>
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

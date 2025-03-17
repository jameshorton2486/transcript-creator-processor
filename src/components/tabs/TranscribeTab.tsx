
import { useState } from "react";
import { AudioTranscriber } from "@/components/AudioTranscriber";
import { TranscriptProcessor } from "@/components/TranscriptProcessor";
import { TranscriptReviewer } from "@/components/TranscriptReviewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { EntityDisplay } from "@/components/EntityDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  
  const handleTranscriptCreated = (transcript: string, jsonData: any, file?: File) => {
    setOriginalTranscript(transcript);
    setJsonData(jsonData);
    if (file) {
      setAudioFile(file);
      setFileName(file.name.split('.')[0]);
    }
  };
  
  const handleTranscriptProcessed = (processedText: string) => {
    setProcessedTranscript(processedText);
  };
  
  const handleAiReviewCompleted = (reviewedText: string) => {
    setAiReviewedTranscript(reviewedText);
    toast({
      title: "AI Review Complete",
      description: "The transcript has been reviewed and improved.",
    });
  };

  const clearWorkspace = () => {
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

  // Define mock entities based on the format you provided
  const mockEntities = jsonData?.entities || {
    "People": ["Jose Orlando Flores Zambrano", "Angelina Neys Cerro", "Michael Stanislaw Mulik", "Antionette Serwaa Hayford"],
    "Organizations": ["DC Law, PLLC", "Deas & Associates", "S.A. Legal Solutions"],
    "Dates": ["March 15, 2023", "April 30"],
    "Legal Terms": ["Contract", "Section 3.4", "Evidence", "Case No. D-1-GN-23-008700"],
    "Courts": ["201st Judicial District"],
    "Locations": ["Travis County, Texas", "Austin, Texas", "San Antonio, Texas"],
  };

  const currentTranscript = aiReviewedTranscript || processedTranscript || originalTranscript;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-6">
        <div className="h-full flex flex-col">
          <AudioTranscriber 
            onTranscriptCreated={handleTranscriptCreated} 
          />
          
          {originalTranscript && (
            <TranscriptProcessor 
              transcript={originalTranscript} 
              onProcessed={handleTranscriptProcessed} 
            />
          )}
          
          {(processedTranscript || originalTranscript) && (
            <TranscriptReviewer
              transcript={processedTranscript || originalTranscript}
              onReviewComplete={handleAiReviewCompleted}
              isLoading={isReviewing}
              setIsLoading={setIsReviewing}
            />
          )}
          
          {(originalTranscript || processedTranscript || aiReviewedTranscript) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Transcript and Files
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all transcript data and uploaded files from the current session.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearWorkspace}>
                    Clear Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      
      <div className="lg:col-span-7 h-[calc(100vh-12rem)]">
        {(originalTranscript || processedTranscript || aiReviewedTranscript) ? (
          <Card className="h-full">
            <CardContent className="p-6 h-full">
              <Tabs defaultValue={aiReviewedTranscript ? "ai-reviewed" : processedTranscript ? "processed" : "original"} className="h-full flex flex-col">
                <TabsList className="mb-4">
                  {originalTranscript && (
                    <TabsTrigger value="original">Original Transcript</TabsTrigger>
                  )}
                  {processedTranscript && (
                    <TabsTrigger value="processed">Processed Transcript</TabsTrigger>
                  )}
                  {aiReviewedTranscript && (
                    <TabsTrigger value="ai-reviewed">AI Reviewed</TabsTrigger>
                  )}
                  {jsonData && (
                    <TabsTrigger value="json">JSON Data</TabsTrigger>
                  )}
                  {currentTranscript && (
                    <TabsTrigger value="entities">Extracted Entities</TabsTrigger>
                  )}
                </TabsList>
                
                <div className="flex-1 h-full overflow-hidden">
                  {originalTranscript && (
                    <TabsContent value="original" className="h-full">
                      <TranscriptViewer 
                        text={originalTranscript} 
                        fileName="original_transcript" 
                      />
                    </TabsContent>
                  )}
                  
                  {processedTranscript && (
                    <TabsContent value="processed" className="h-full">
                      <TranscriptViewer 
                        text={processedTranscript} 
                        fileName="processed_transcript" 
                      />
                    </TabsContent>
                  )}
                  
                  {aiReviewedTranscript && (
                    <TabsContent value="ai-reviewed" className="h-full">
                      <TranscriptViewer 
                        text={aiReviewedTranscript} 
                        fileName="ai_reviewed_transcript" 
                      />
                    </TabsContent>
                  )}
                  
                  {jsonData && (
                    <TabsContent value="json" className="h-full">
                      <TranscriptViewer 
                        text={JSON.stringify(jsonData, null, 2)} 
                        fileName="transcript_data.json" 
                      />
                    </TabsContent>
                  )}
                  
                  {currentTranscript && (
                    <TabsContent value="entities" className="h-full">
                      <EntityDisplay entities={mockEntities} />
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center h-full text-center text-gray-500">
            <h3 className="text-lg font-medium">No transcript yet</h3>
            <p className="mt-2">Upload an audio file and click "Transcribe Audio" to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};


import { useState } from "react";
import { Header } from "@/components/Header";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { AudioTranscriber } from "@/components/AudioTranscriber";
import { TranscriptProcessor } from "@/components/TranscriptProcessor";
import { EntityDisplay } from "@/components/EntityDisplay";
import { TranscriptReviewer } from "@/components/TranscriptReviewer";
import { AITrainingCenter } from "@/components/training/AITrainingCenter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";
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

const Index = () => {
  const [originalTranscript, setOriginalTranscript] = useState<string>("");
  const [processedTranscript, setProcessedTranscript] = useState<string>("");
  const [aiReviewedTranscript, setAiReviewedTranscript] = useState<string>("");
  const [jsonData, setJsonData] = useState<any>(null);
  const [fileName, setFileName] = useState<string>("transcript");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("transcribe");
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

  // Extract entities from the processed transcript for the entities tab
  const mockEntities = {
    "People": ["Smith", "Jones"],
    "Organizations": ["Court"],
    "Dates": ["March 15, 2023", "April 30"],
    "Legal Terms": ["Contract", "Section 3.4", "Evidence", "Case No. 2023-CV-12345"]
  };

  // Determine which transcript to display as the current active one
  const currentTranscript = aiReviewedTranscript || processedTranscript || originalTranscript;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="transcribe">Transcribe & Process</TabsTrigger>
            <TabsTrigger value="train">AI Training</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {activeTab === "transcribe" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
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
            
            <div className="lg:col-span-2">
              {(originalTranscript || processedTranscript || aiReviewedTranscript) ? (
                <Card>
                  <CardContent className="p-6">
                    <Tabs defaultValue={aiReviewedTranscript ? "ai-reviewed" : processedTranscript ? "processed" : "original"}>
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
                      
                      {originalTranscript && (
                        <TabsContent value="original">
                          <TranscriptViewer 
                            text={originalTranscript} 
                            fileName="original_transcript" 
                          />
                        </TabsContent>
                      )}
                      
                      {processedTranscript && (
                        <TabsContent value="processed">
                          <TranscriptViewer 
                            text={processedTranscript} 
                            fileName="processed_transcript" 
                          />
                        </TabsContent>
                      )}
                      
                      {aiReviewedTranscript && (
                        <TabsContent value="ai-reviewed">
                          <TranscriptViewer 
                            text={aiReviewedTranscript} 
                            fileName="ai_reviewed_transcript" 
                          />
                        </TabsContent>
                      )}
                      
                      {jsonData && (
                        <TabsContent value="json">
                          <TranscriptViewer 
                            text={JSON.stringify(jsonData, null, 2)} 
                            fileName="transcript_data.json" 
                          />
                        </TabsContent>
                      )}
                      
                      {currentTranscript && (
                        <TabsContent value="entities">
                          <EntityDisplay entities={mockEntities} />
                        </TabsContent>
                      )}
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center min-h-[500px] text-center text-gray-500">
                  <h3 className="text-lg font-medium">No transcript yet</h3>
                  <p className="mt-2">Upload an audio file and click "Transcribe Audio" to begin.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === "train" && (
          <AITrainingCenter />
        )}
      </main>
    </div>
  );
};

export default Index;

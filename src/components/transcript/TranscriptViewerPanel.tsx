
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { EntityDisplay } from "@/components/EntityDisplay";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

interface TranscriptViewerPanelProps {
  originalTranscript: string;
  processedTranscript: string;
  aiReviewedTranscript: string;
  jsonData: any;
  fileName: string;
  currentTranscript: string;
}

export const TranscriptViewerPanel = ({
  originalTranscript,
  processedTranscript,
  aiReviewedTranscript,
  jsonData,
  fileName,
  currentTranscript,
}: TranscriptViewerPanelProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Define mock entities based on the jsonData
  const mockEntities = jsonData?.entities || {
    "People": ["Jose Orlando Flores Zambrano", "Angelina Neys Cerro", "Michael Stanislaw Mulik", "Antionette Serwaa Hayford"],
    "Organizations": ["DC Law, PLLC", "Deas & Associates", "S.A. Legal Solutions"],
    "Dates": ["March 15, 2023", "April 30"],
    "Legal Terms": ["Contract", "Section 3.4", "Evidence", "Case No. D-1-GN-23-008700"],
    "Courts": ["201st Judicial District"],
    "Locations": ["Travis County, Texas", "Austin, Texas", "San Antonio, Texas"],
  };

  if (!originalTranscript && !processedTranscript && !aiReviewedTranscript) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center h-full text-center text-gray-500">
        <h3 className="text-lg font-medium">No transcript yet</h3>
        <p className="mt-2">Upload an audio file and click "Transcribe Audio" to begin.</p>
      </div>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="p-6 h-full">
        <div className="flex justify-between items-center mb-4">
          <Tabs defaultValue={aiReviewedTranscript ? "ai-reviewed" : processedTranscript ? "processed" : "original"} className="w-full">
            <TabsList>
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
          </Tabs>
          
          {currentTranscript && (
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 ml-2"
                >
                  <FileText className="h-4 w-4" />
                  Word Preview
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[80vh]">
                <DrawerHeader>
                  <DrawerTitle>Transcript Word Preview</DrawerTitle>
                </DrawerHeader>
                <div className="p-6 overflow-auto h-[calc(80vh-70px)]">
                  <div className="bg-white shadow-md rounded-md p-8 max-w-3xl mx-auto border border-gray-200">
                    <div className="prose max-w-none">
                      <h1 className="text-2xl font-bold mb-6">{fileName || "Transcript"}</h1>
                      {currentTranscript.split("\n").map((line, index) => {
                        if (/^(Speaker \d+:|[A-Z][A-Z\s']+:)/.test(line)) {
                          return <p key={index} className="font-bold mt-4">{line}</p>;
                        } else if (/^(Q|A):/.test(line)) {
                          return <p key={index} className="font-bold mt-3">{line}</p>;
                        } else {
                          return <p key={index} className="mt-1">{line}</p>;
                        }
                      })}
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </div>
        
        <div className="h-[calc(100%-3rem)] overflow-hidden">
          {originalTranscript && (
            <TabsContent value="original" className="h-full m-0">
              <TranscriptViewer 
                text={originalTranscript} 
                fileName="original_transcript" 
              />
            </TabsContent>
          )}
          
          {processedTranscript && (
            <TabsContent value="processed" className="h-full m-0">
              <TranscriptViewer 
                text={processedTranscript} 
                fileName="processed_transcript" 
              />
            </TabsContent>
          )}
          
          {aiReviewedTranscript && (
            <TabsContent value="ai-reviewed" className="h-full m-0">
              <TranscriptViewer 
                text={aiReviewedTranscript} 
                fileName="ai_reviewed_transcript" 
              />
            </TabsContent>
          )}
          
          {jsonData && (
            <TabsContent value="json" className="h-full m-0">
              <TranscriptViewer 
                text={JSON.stringify(jsonData, null, 2)} 
                fileName="transcript_data.json" 
              />
            </TabsContent>
          )}
          
          {currentTranscript && (
            <TabsContent value="entities" className="h-full m-0">
              <EntityDisplay entities={mockEntities} />
            </TabsContent>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

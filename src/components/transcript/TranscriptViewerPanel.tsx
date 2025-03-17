
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { EntityDisplay } from "@/components/EntityDisplay";

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
  );
};

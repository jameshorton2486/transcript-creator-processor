
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { EntityDisplay } from "@/components/EntityDisplay";
import { TranscriptToolbar } from './controls/TranscriptToolbar';
import { WordPreviewDrawer } from './controls/WordPreviewDrawer';

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

  // Determine which tab should be active by default
  const defaultTab = aiReviewedTranscript ? "ai-reviewed" : 
                    processedTranscript ? "processed" : 
                    originalTranscript ? "original" : "";

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
      <CardContent className="p-0 h-full flex flex-col">
        <TranscriptToolbar 
          currentTranscript={currentTranscript}
          fileName={fileName}
          jsonData={jsonData}
        />
        
        <div className="flex-grow overflow-hidden">
          <Tabs defaultValue={defaultTab} className="w-full h-full">
            <TabsList className="px-6 pt-6 pb-2">
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
            
            <div className="h-[calc(100%-3rem)] overflow-hidden">
              {originalTranscript && (
                <TabsContent value="original" className="h-full m-0">
                  <TranscriptViewer 
                    text={originalTranscript} 
                    fileName={`${fileName}_original`} 
                  />
                </TabsContent>
              )}
              
              {processedTranscript && (
                <TabsContent value="processed" className="h-full m-0">
                  <TranscriptViewer 
                    text={processedTranscript} 
                    fileName={`${fileName}_processed`} 
                  />
                </TabsContent>
              )}
              
              {aiReviewedTranscript && (
                <TabsContent value="ai-reviewed" className="h-full m-0">
                  <TranscriptViewer 
                    text={aiReviewedTranscript} 
                    fileName={`${fileName}_ai_reviewed`} 
                  />
                </TabsContent>
              )}
              
              {jsonData && (
                <TabsContent value="json" className="h-full m-0">
                  <div className="flex flex-col h-full">
                    <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
                      <h3 className="text-sm font-medium">JSON Data</h3>
                    </div>
                    <div className="flex-grow overflow-auto">
                      <TranscriptViewer 
                        text={JSON.stringify(jsonData, null, 2)} 
                        fileName="transcript_data.json" 
                      />
                    </div>
                  </div>
                </TabsContent>
              )}
              
              {currentTranscript && (
                <TabsContent value="entities" className="h-full m-0">
                  <div className="flex flex-col h-full">
                    <div className="p-3 bg-slate-50 border-b">
                      <h3 className="text-sm font-medium">Extracted Entities</h3>
                    </div>
                    <div className="flex-grow overflow-auto p-4">
                      <EntityDisplay entities={mockEntities} />
                    </div>
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
        
        {currentTranscript && (
          <div className="p-4 border-t flex justify-end">
            <WordPreviewDrawer 
              currentTranscript={currentTranscript}
              fileName={fileName}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

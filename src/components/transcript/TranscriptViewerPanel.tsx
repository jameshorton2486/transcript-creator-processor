
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscriptToolbar } from "@/components/transcript/controls/TranscriptToolbar";
import { FormattedTranscriptView } from "@/components/transcript/FormattedTranscriptView";
import { RawTranscriptView } from "@/components/transcript/RawTranscriptView";
import { WordPreviewDrawer } from "@/components/transcript/controls/WordPreviewDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Edit } from "lucide-react";

interface TranscriptViewerPanelProps {
  originalTranscript: string;
  processedTranscript: string;
  aiReviewedTranscript: string;
  jsonData: any;
  fileName: string;
  currentTranscript: string;
}

export const TranscriptViewerPanel: React.FC<TranscriptViewerPanelProps> = ({
  originalTranscript,
  processedTranscript,
  aiReviewedTranscript,
  jsonData,
  fileName,
  currentTranscript,
}) => {
  const [activeTab, setActiveTab] = useState<string>("view");
  
  return (
    <Card className="h-full overflow-hidden shadow-md">
      <CardHeader className="px-4 py-2 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Transcript Preview</CardTitle>
          <div className="flex items-center gap-2">
            {currentTranscript && (
              <WordPreviewDrawer 
                currentTranscript={currentTranscript} 
                fileName={fileName} 
              />
            )}
          </div>
        </div>
      </CardHeader>
      
      <TranscriptToolbar 
        currentTranscript={currentTranscript}
        fileName={fileName}
        jsonData={jsonData}
      />
      
      <Tabs 
        defaultValue="view" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="h-[calc(100%-114px)] flex flex-col"
      >
        <div className="border-b px-3 bg-slate-50">
          <TabsList className="h-10">
            <TabsTrigger value="view" className="data-[state=active]:bg-white">
              <FileText className="h-4 w-4 mr-2" />
              View
            </TabsTrigger>
            <TabsTrigger value="process" className="data-[state=active]:bg-white" data-value="process">
              <Edit className="h-4 w-4 mr-2" />
              Process
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-auto">
          <TabsContent value="view" className="h-full m-0 p-0 data-[state=active]:overflow-auto">
            {currentTranscript ? (
              <FormattedTranscriptView formattedText={currentTranscript} />
            ) : (
              <div className="flex h-full items-center justify-center text-center p-6 text-slate-500">
                <div>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium mb-2">No transcript available</h3>
                  <p className="max-w-md">
                    Upload an audio file or use the transcription tools to create a transcript.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="process" className="h-full m-0 p-0 data-[state=active]:overflow-auto">
            {originalTranscript ? (
              <div className="p-6 h-full">
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Original Transcript</h3>
                  <RawTranscriptView transcript={originalTranscript} />
                </div>
                
                {processedTranscript && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Processed Transcript</h3>
                    <RawTranscriptView transcript={processedTranscript} />
                  </div>
                )}
                
                {!processedTranscript && (
                  <div className="mt-6 p-4 border rounded-md bg-slate-50">
                    <p className="text-center text-slate-600">
                      Use the processing tools in the left panel to format and improve this transcript.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center p-6 text-slate-500">
                <div>
                  <Edit className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium mb-2">No transcript to process</h3>
                  <p className="max-w-md">
                    Create a transcript first, then use this tab to process and format it.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

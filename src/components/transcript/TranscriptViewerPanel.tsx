
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscriptToolbar } from "@/components/transcript/controls/TranscriptToolbar";
import { FormattedTranscriptView } from "@/components/transcript/FormattedTranscriptView";
import { RawTranscriptView } from "@/components/transcript/RawTranscriptView";
import { WordPreviewDrawer } from "@/components/transcript/controls/WordPreviewDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Edit, FileType2 } from "lucide-react";
import { TranscriptViewer } from "@/components/TranscriptViewer"; // Added import

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
  
  // Add enhanced console log to debug transcript data flow
  console.log("TranscriptViewerPanel received:", {
    originalLength: originalTranscript?.length,
    processedLength: processedTranscript?.length,
    aiReviewedLength: aiReviewedTranscript?.length,
    currentLength: currentTranscript?.length,
    hasTranscript: Boolean(currentTranscript),
    activeTab,
    currentTranscriptSample: currentTranscript?.substring(0, 100),
    currentTranscriptType: typeof currentTranscript,
    originalFirstChars: originalTranscript?.substring(0, 20)?.replace(/\n/g, "\\n"),
    processedFirstChars: processedTranscript?.substring(0, 20)?.replace(/\n/g, "\\n"),
    currentFirstChars: currentTranscript?.substring(0, 20)?.replace(/\n/g, "\\n")
  });
  
  // Verify if currentTranscript is being properly passed to child components
  useEffect(() => {
    console.log("TranscriptViewerPanel checking currentTranscript:", {
      hasContent: Boolean(currentTranscript?.trim()),
      length: currentTranscript?.length,
      sample: currentTranscript?.substring(0, 50)
    });
  }, [currentTranscript]);
  
  // Effect to detect tab changes
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
  }, [activeTab]);
  
  // Less strict rendering condition - only check if completely undefined
  const hasTranscript = currentTranscript !== undefined;
  
  return (
    <Card className="h-full overflow-hidden shadow-md border-slate-200">
      <CardHeader className="px-4 py-3 border-b bg-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center text-slate-800">
            <FileType2 className="h-5 w-5 mr-2 text-slate-600" />
            Transcript Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasTranscript && (
              <WordPreviewDrawer 
                currentTranscript={currentTranscript || ''} 
                fileName={fileName} 
              />
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Always render the toolbar, but it will handle its own visibility */}
      <TranscriptToolbar 
        currentTranscript={currentTranscript || ''}
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
        
        <div className="flex-1 overflow-auto relative">
          <TabsContent value="view" className="h-full m-0 p-0 block" forceMount={true} hidden={activeTab !== "view"}>
            {/* IMPORTANT: Debug output to check what's being passed to the viewer */}
            <div className="hidden">
              Debug transcript: Length={currentTranscript?.length || 0}, 
              Empty={String(currentTranscript === "")}, 
              Undefined={String(currentTranscript === undefined)},
              First chars: {currentTranscript?.substring(0, 20)}
            </div>
            
            {/* Use TranscriptViewer for the view tab */}
            {hasTranscript ? (
              <TranscriptViewer 
                text={currentTranscript || ''} 
                fileName={fileName}
                jsonData={jsonData}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-center p-6 text-slate-500 bg-slate-50/50">
                <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm max-w-md">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium mb-2 text-slate-700">No transcript available</h3>
                  <p className="text-slate-600">
                    Upload an audio file or use the transcription tools to create a transcript.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="process" className="h-full m-0 p-0 block" forceMount={true} hidden={activeTab !== "process"}>
            {/* Less strict rendering condition */}
            {originalTranscript !== undefined ? (
              <div className="p-6 h-full bg-slate-50/50">
                <div className="mb-6 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-slate-700 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-slate-500" />
                    Original Transcript
                  </h3>
                  <div className="border rounded-md shadow-sm">
                    <RawTranscriptView transcript={originalTranscript || ''} />
                  </div>
                </div>
                
                {processedTranscript && (
                  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-medium mb-3 text-slate-700 flex items-center">
                      <Edit className="h-5 w-5 mr-2 text-slate-500" />
                      Processed Transcript
                    </h3>
                    <div className="border rounded-md shadow-sm">
                      <RawTranscriptView transcript={processedTranscript} />
                    </div>
                  </div>
                )}
                
                {!processedTranscript && (
                  <div className="mt-6 p-6 border rounded-md bg-white text-center shadow-sm">
                    <p className="text-slate-600">
                      Use the processing tools in the left panel to format and improve this transcript.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center p-6 text-slate-500 bg-slate-50/50">
                <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm max-w-md">
                  <Edit className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium mb-2 text-slate-700">No transcript to process</h3>
                  <p className="text-slate-600">
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

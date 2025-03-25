
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { EntityDisplay } from "@/components/EntityDisplay";
import { Button } from "@/components/ui/button";
import { FileText, Clipboard, Download, Check } from "lucide-react";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Document, Packer } from "docx";
import { saveAs } from 'file-saver';
import { createWordDocument } from './docxGenerator';

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
  const [copied, setCopied] = useState(false);
  
  // Reset copied state after 2 seconds
  useState(() => {
    let timer: NodeJS.Timeout;
    if (copied) {
      timer = setTimeout(() => setCopied(false), 2000);
    }
    return () => clearTimeout(timer);
  }, [copied]);
  
  // Function to copy transcript text to clipboard
  const copyToClipboard = () => {
    if (currentTranscript) {
      navigator.clipboard.writeText(currentTranscript)
        .then(() => setCopied(true))
        .catch(err => console.error('Failed to copy: ', err));
    }
  };

  // Function to download transcript as a text file
  const downloadTranscript = () => {
    if (currentTranscript) {
      const element = document.createElement("a");
      const file = new Blob([currentTranscript], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${fileName}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  // Function to download transcript as a Word document
  const downloadWordDocument = () => {
    if (currentTranscript) {
      const doc = createWordDocument(currentTranscript);
      
      // Generate and save the file
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${fileName}.docx`);
      });
    }
  };
  
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
        {currentTranscript && (
          <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
            <h3 className="text-sm font-medium">Transcript Options</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyToClipboard}
                className="flex items-center gap-1"
              >
                {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadTranscript}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadWordDocument}
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                Word
              </Button>
            </div>
          </div>
        )}
        
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
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

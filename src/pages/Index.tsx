
import { useState } from "react";
import { Header } from "@/components/Header";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { AudioTranscriber } from "@/components/AudioTranscriber";
import { TranscriptProcessor } from "@/components/TranscriptProcessor";
import { EntityDisplay } from "@/components/EntityDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const [originalTranscript, setOriginalTranscript] = useState<string>("");
  const [processedTranscript, setProcessedTranscript] = useState<string>("");
  const [jsonData, setJsonData] = useState<any>(null);
  const [fileName, setFileName] = useState<string>("transcript");
  
  const handleTranscriptCreated = (transcript: string, jsonData: any) => {
    setOriginalTranscript(transcript);
    setJsonData(jsonData);
  };
  
  const handleTranscriptProcessed = (processedText: string) => {
    setProcessedTranscript(processedText);
  };

  // Extract entities from the processed transcript for the entities tab
  const mockEntities = {
    "People": ["Smith", "Jones"],
    "Organizations": ["Court"],
    "Dates": ["March 15, 2023", "April 30"],
    "Legal Terms": ["Contract", "Section 3.4", "Evidence", "Case No. 2023-CV-12345"]
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <AudioTranscriber onTranscriptCreated={handleTranscriptCreated} />
            
            {originalTranscript && (
              <TranscriptProcessor 
                transcript={originalTranscript} 
                onProcessed={handleTranscriptProcessed} 
              />
            )}
          </div>
          
          <div className="lg:col-span-2">
            {(originalTranscript || processedTranscript) ? (
              <Card>
                <CardContent className="p-6">
                  <Tabs defaultValue={processedTranscript ? "processed" : "original"}>
                    <TabsList className="mb-4">
                      {originalTranscript && (
                        <TabsTrigger value="original">Original Transcript</TabsTrigger>
                      )}
                      {processedTranscript && (
                        <TabsTrigger value="processed">Processed Transcript</TabsTrigger>
                      )}
                      {jsonData && (
                        <TabsTrigger value="json">JSON Data</TabsTrigger>
                      )}
                      {processedTranscript && (
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
                    
                    {jsonData && (
                      <TabsContent value="json">
                        <TranscriptViewer 
                          text={JSON.stringify(jsonData, null, 2)} 
                          fileName="transcript_data.json" 
                        />
                      </TabsContent>
                    )}
                    
                    {processedTranscript && (
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
      </main>
    </div>
  );
};

export default Index;

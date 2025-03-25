
import { useState } from "react";
import { Header } from "@/components/Header";
import { AITrainingCenter } from "@/components/training/AITrainingCenter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscribeTab } from "@/components/tabs/TranscribeTab";
import { AppToolbar } from "@/components/AppToolbar";

const Index = () => {
  const [originalTranscript, setOriginalTranscript] = useState<string>("");
  const [processedTranscript, setProcessedTranscript] = useState<string>("");
  const [aiReviewedTranscript, setAiReviewedTranscript] = useState<string>("");
  const [jsonData, setJsonData] = useState<any>(null);
  const [fileName, setFileName] = useState<string>("transcript");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("transcribe");
  
  // Function to handle toolbar button clicks
  const handleToolbarAction = (action: string) => {
    if (action === "transcribe") {
      setActiveTab("transcribe");
    } else if (action === "process") {
      // Focus on processing tab if transcript exists
      if (originalTranscript) {
        setActiveTab("transcribe");
        // You could add logic to scroll to the processor component
      }
    } else if (action === "configure") {
      // Could open a configuration modal or switch to a settings tab
      console.log("Configure options clicked");
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <AppToolbar 
          activeTab={activeTab}
          onTranscribeClick={() => handleToolbarAction("transcribe")}
          onProcessClick={originalTranscript ? () => handleToolbarAction("process") : undefined}
          onConfigureClick={() => handleToolbarAction("configure")}
        />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="transcribe">Transcribe & Process</TabsTrigger>
            <TabsTrigger value="train">AI Training</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {activeTab === "transcribe" && (
          <TranscribeTab 
            originalTranscript={originalTranscript}
            processedTranscript={processedTranscript}
            aiReviewedTranscript={aiReviewedTranscript}
            jsonData={jsonData}
            fileName={fileName}
            setOriginalTranscript={setOriginalTranscript}
            setProcessedTranscript={setProcessedTranscript}
            setAiReviewedTranscript={setAiReviewedTranscript}
            setJsonData={setJsonData}
            setFileName={setFileName}
            setAudioFile={setAudioFile}
            isReviewing={isReviewing}
            setIsReviewing={setIsReviewing}
          />
        )}
        
        {activeTab === "train" && (
          <AITrainingCenter />
        )}
      </main>
    </div>
  );
};

export default Index;

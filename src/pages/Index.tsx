
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { AITrainingCenter } from "@/components/training/AITrainingCenter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscribeTab } from "@/components/tabs/TranscribeTab";
import { useSearchParams } from "react-router-dom";

const Index = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  
  const [originalTranscript, setOriginalTranscript] = useState<string>("");
  const [processedTranscript, setProcessedTranscript] = useState<string>("");
  const [aiReviewedTranscript, setAiReviewedTranscript] = useState<string>("");
  const [jsonData, setJsonData] = useState<any>(null);
  const [fileName, setFileName] = useState<string>("transcript");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>(tabParam === "train" ? "train" : "transcribe");
  
  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam === "train") {
      setActiveTab("train");
    } else if (tabParam === "transcribe") {
      setActiveTab("transcribe");
    }
  }, [tabParam]);
  
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

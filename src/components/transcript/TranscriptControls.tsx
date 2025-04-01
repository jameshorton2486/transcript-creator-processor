
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Wand2, RefreshCw } from 'lucide-react';
import DeepgramTranscriber from '@/components/DeepgramTranscriber';
import { TranscriptionResult } from '@/lib/deepgram/types';

interface TranscriptControlsProps {
  originalTranscript: string;
  processedTranscript: string;
  onTranscriptCreated: (transcript: string, jsonData: any, file?: File) => void;
  onTranscriptProcessed: (processedText: string) => void;
  onAiReviewCompleted: (reviewedText: string) => void;
  onClearWorkspace: () => void;
  isReviewing: boolean;
  setIsReviewing: (isReviewing: boolean) => void;
}

export const TranscriptControls: React.FC<TranscriptControlsProps> = ({
  originalTranscript,
  processedTranscript,
  onTranscriptCreated,
  onTranscriptProcessed,
  onAiReviewCompleted,
  onClearWorkspace,
  isReviewing,
  setIsReviewing,
}) => {
  const [activeTab, setActiveTab] = useState<string>("create");
  
  const handleTranscriptionComplete = (result: TranscriptionResult) => {
    if (result && result.transcript) {
      onTranscriptCreated(result.transcript, result);
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <Card>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="border-b border-slate-200 px-4 py-2">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="create" data-state={activeTab === "create" ? "active" : ""}>
              <FileText className="h-4 w-4 mr-2" />
              Create
            </TabsTrigger>
            <TabsTrigger 
              value="process" 
              disabled={!originalTranscript}
              data-state={activeTab === "process" ? "active" : ""}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Process
            </TabsTrigger>
            <TabsTrigger 
              value="ai" 
              disabled={!processedTranscript}
              data-state={activeTab === "ai" ? "active" : ""}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              AI Review
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-4">
          {activeTab === "create" && (
            <div className="space-y-4">
              {originalTranscript && (
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onClearWorkspace}
                  >
                    Clear Workspace
                  </Button>
                </div>
              )}
              <DeepgramTranscriber 
                onTranscriptionComplete={handleTranscriptionComplete}
                showTranscription={false}
              />
            </div>
          )}
          
          {activeTab === "process" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Process Transcript</h3>
              <p className="text-sm text-slate-500">
                Apply processing rules to format and improve your transcript.
              </p>
              
              <Button
                onClick={() => onTranscriptProcessed(originalTranscript)}
                className="w-full"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Format Transcript
              </Button>
            </div>
          )}
          
          {activeTab === "ai" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">AI Review</h3>
              <p className="text-sm text-slate-500">
                Let AI review your transcript to improve accuracy and formatting.
              </p>
              
              <Button
                onClick={() => {
                  setIsReviewing(true);
                  setTimeout(() => {
                    onAiReviewCompleted(processedTranscript);
                    setIsReviewing(false);
                  }, 2000);
                }}
                disabled={isReviewing}
                className="w-full"
              >
                {isReviewing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Reviewing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Review with AI
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Tabs>
    </Card>
  );
};

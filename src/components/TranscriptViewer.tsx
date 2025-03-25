
import React, { useRef, useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { ViewerToolbar } from './transcript/ViewerToolbar';
import { FormattedTranscriptView } from './transcript/FormattedTranscriptView';
import { RawTranscriptView } from './transcript/RawTranscriptView';
import { formatTranscript } from './transcript/transcriptFormatter';

interface TranscriptViewerProps {
  text: string;
  fileName?: string;
}

export const TranscriptViewer = ({ text, fileName = "transcript" }: TranscriptViewerProps) => {
  const [activeTab, setActiveTab] = useState<string>("formatted");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Enhanced formatted transcript with better speaker label highlighting
  const formattedText = useMemo(() => formatTranscript(text), [text]);

  if (!text) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center h-full">
          <div className="text-center text-slate-500">
            No transcript available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <ViewerToolbar 
        text={text}
        formattedText={formattedText}
        fileName={fileName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <CardContent className="p-0 flex-1 overflow-auto relative">
        <TabsContent value="formatted" className="m-0 h-full">
          <FormattedTranscriptView formattedText={formattedText} />
        </TabsContent>
        
        <TabsContent value="raw" className="m-0 h-full">
          <RawTranscriptView text={text} textAreaRef={textAreaRef} />
        </TabsContent>
      </CardContent>
    </Card>
  );
};

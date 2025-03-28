
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { ViewerToolbar } from './transcript/ViewerToolbar';
import { FormattedTranscriptView } from './transcript/FormattedTranscriptView';
import { RawTranscriptView } from './transcript/RawTranscriptView';
import { formatTranscript } from './transcript/transcriptFormatter';
import { FileText } from "lucide-react";

interface TranscriptViewerProps {
  text: string;
  fileName?: string;
  jsonData?: any;
}

export const TranscriptViewer = ({ text = "", fileName = "transcript", jsonData }: TranscriptViewerProps) => {
  const [activeTab, setActiveTab] = useState<string>("formatted");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Enhanced formatted transcript with better speaker label highlighting
  const formattedText = useMemo(() => {
    try {
      if (!text || text.trim().length === 0) {
        console.log("Cannot format empty text, returning empty string");
        return '';
      }
      return formatTranscript(text);
    } catch (err) {
      console.error("Error formatting transcript:", err);
      return text || '';
    }
  }, [text]);

  // Detailed debug logging for TranscriptViewer props
  useEffect(() => {
    console.log("TranscriptViewer received text prop:", {
      received: text !== undefined, 
      type: typeof text,
      isEmpty: text === '',
      isNull: text === null,
      length: text?.length,
      trimmedLength: text?.trim()?.length,
      firstChars: text?.substring(0, 50)?.replace(/\n/g, "\\n"),
      formattedTextGenerated: Boolean(formattedText),
      formattedLength: formattedText?.length
    });
  }, [text, formattedText]);
  
  // Safeguard: normalize the text to always be a string
  const safeText = text || "";
  
  // Check if there's meaningful content (not just whitespace)
  const hasContent = safeText.trim().length > 0;
  
  // If no meaningful content, show empty state
  if (!hasContent) {
    console.log("TranscriptViewer showing empty state because there's no meaningful content");
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center h-full">
          <div className="text-center text-slate-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <div className="text-lg font-medium mb-2">No transcript available</div>
            <div className="text-sm max-w-md mx-auto">
              Upload an audio file or use the "Load Sample Transcript" button to create a transcript.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // We have content, render the transcript viewer
  console.log("TranscriptViewer rendering with text content");
  return (
    <Card className="h-full flex flex-col">
      <ViewerToolbar 
        text={safeText}
        formattedText={formattedText}
        fileName={fileName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        jsonData={jsonData}
      />
      
      <CardContent className="p-0 flex-1 overflow-auto relative">
        <TabsContent value="formatted" className="m-0 h-full block" forceMount={true} hidden={activeTab !== "formatted"}>
          <FormattedTranscriptView formattedText={formattedText} />
        </TabsContent>
        
        <TabsContent value="raw" className="m-0 h-full block" forceMount={true} hidden={activeTab !== "raw"}>
          <RawTranscriptView transcript={safeText} textAreaRef={textAreaRef} />
        </TabsContent>
      </CardContent>
    </Card>
  );
};

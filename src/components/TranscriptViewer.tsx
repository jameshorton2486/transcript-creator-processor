
import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clipboard, Download, Check } from "lucide-react";

interface TranscriptViewerProps {
  text: string;
  fileName?: string;
}

export const TranscriptViewer = ({ text, fileName = "transcript" }: TranscriptViewerProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("formatted");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Enhanced formatted transcript with better speaker label highlighting
  const formattedText = useMemo(() => formatTranscript(text), [text]);
  
  // Reset copied state after 2 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (copied) {
      timer = setTimeout(() => setCopied(false), 2000);
    }
    return () => clearTimeout(timer);
  }, [copied]);

  // Function to copy transcript text to clipboard
  const copyToClipboard = () => {
    if (textAreaRef.current) {
      navigator.clipboard.writeText(activeTab === "raw" ? text : formattedText)
        .then(() => setCopied(true))
        .catch(err => console.error('Failed to copy: ', err));
    }
  };

  // Function to download transcript as a text file
  const downloadTranscript = () => {
    const element = document.createElement("a");
    const fileToDownload = activeTab === "raw" ? text : formattedText;
    const file = new Blob([fileToDownload], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Helper function to enhance transcript formatting especially for speaker labels
  function formatTranscript(text: string): string {
    if (!text) return "";
    
    // Apply special formatting to speaker labels
    return text
      // Style standard speaker format (Speaker 1:)
      .replace(/^(Speaker \d+:)/gm, match => `\n${match}`)
      
      // Style legal transcript format (THE COURT:, WITNESS:, etc.)
      .replace(/^([A-Z][A-Z\s']+:)/gm, match => `\n${match}`)
      
      // Style Q&A format
      .replace(/^(Q|A):\s/gm, match => `\n${match}`)
      
      // Ensure proper spacing after speaker changes
      .replace(/(Speaker \d+:|[A-Z][A-Z\s']+:)(\s*)/g, '$1\n    ')
      
      // Clean up any excessive newlines
      .replace(/\n{3,}/g, '\n\n');
  }

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
      <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="formatted">Formatted</TabsTrigger>
            <TabsTrigger value="raw">Raw Text</TabsTrigger>
          </TabsList>
        </Tabs>
        
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
        </div>
      </div>
      
      <CardContent className="p-0 flex-1 overflow-auto">
        <TabsContent value="formatted" className="m-0 h-full">
          <div className="prose max-w-none p-6 h-full">
            {formattedText.split('\n').map((line, i) => {
              // Apply special styling to speaker labels
              if (/^(Speaker \d+:|[A-Z][A-Z\s']+:)/.test(line)) {
                return (
                  <div key={i} className="mt-4 font-semibold">
                    {line}
                  </div>
                );
              } 
              // Apply special styling to Q&A format
              else if (/^(Q|A):/.test(line)) {
                return (
                  <div key={i} className="mt-3 font-semibold">
                    {line}
                  </div>
                );
              }
              // Regular text
              else {
                return <p key={i} className="my-1">{line}</p>;
              }
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="raw" className="m-0 h-full">
          <textarea
            ref={textAreaRef}
            className="w-full h-full p-6 text-sm font-mono border-0 focus:outline-none focus:ring-0 resize-none"
            value={text}
            readOnly
          />
        </TabsContent>
      </CardContent>
    </Card>
  );
};

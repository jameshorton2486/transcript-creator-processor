import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clipboard, Download, Check, FileText } from "lucide-react";
import { Packer } from "docx";
import { saveAs } from 'file-saver';
import { createWordDocument } from './docx';

interface ViewerToolbarProps {
  text: string;
  formattedText: string;
  fileName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  jsonData?: any;
}

export const ViewerToolbar = ({ 
  text, 
  formattedText, 
  fileName, 
  activeTab, 
  setActiveTab,
  jsonData
}: ViewerToolbarProps) => {
  const [copied, setCopied] = useState(false);
  
  // Reset copied state after 2 seconds
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (copied) {
      timer = setTimeout(() => setCopied(false), 2000);
    }
    return () => clearTimeout(timer);
  }, [copied]);

  // Log toolbar visibility and props
  React.useEffect(() => {
    console.log("ViewerToolbar rendered:", {
      hasText: Boolean(text),
      textLength: text?.length,
      hasFormattedText: Boolean(formattedText),
      formattedTextLength: formattedText?.length,
      activeTab
    });
  }, [text, formattedText, activeTab]);

  // Function to copy transcript text to clipboard
  const copyToClipboard = () => {
    const contentToCopy = activeTab === "raw" ? text : formattedText;
    console.log("Copying to clipboard:", { contentLength: contentToCopy?.length });
    
    navigator.clipboard.writeText(contentToCopy || '')
      .then(() => setCopied(true))
      .catch(err => console.error('Failed to copy: ', err));
  };

  // Function to download transcript as a text file
  const downloadTranscript = () => {
    const element = document.createElement("a");
    const fileToDownload = activeTab === "raw" ? text : formattedText;
    const file = new Blob([fileToDownload || ''], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Function to download transcript as a Word document
  const downloadWordDocument = () => {
    const doc = createWordDocument(formattedText || '', fileName);
    
    // Generate and save the file
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `${fileName}.docx`);
    });
  };

  // Function to download JSON data
  const downloadJsonData = () => {
    if (jsonData) {
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, `${fileName}_data.json`);
    }
  };

  return (
    <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 shadow-sm">
          <TabsTrigger value="formatted" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Formatted
          </TabsTrigger>
          <TabsTrigger value="raw" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Raw Text
          </TabsTrigger>
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
          Text
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

        {jsonData && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadJsonData}
            className="flex items-center gap-1"
          >
            <FileText className="h-4 w-4" />
            JSON
          </Button>
        )}
      </div>
    </div>
  );
};

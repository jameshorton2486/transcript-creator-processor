
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Clipboard, Download, Check, FileText } from "lucide-react";
import { Document, Packer } from "docx";
import { saveAs } from 'file-saver';
import { createWordDocument } from '../docxGenerator';

interface DownloadOptionsProps {
  currentTranscript: string;
  fileName: string;
  jsonData?: any;
}

export const DownloadOptions = ({ currentTranscript, fileName, jsonData }: DownloadOptionsProps) => {
  const [copied, setCopied] = useState(false);
  
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

  // Function to download JSON data
  const downloadJsonData = () => {
    if (jsonData) {
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, `${fileName}_data.json`);
    }
  };
  
  return (
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
  );
};

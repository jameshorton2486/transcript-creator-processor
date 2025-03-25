
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Clipboard, Download, Check, FileText } from "lucide-react";
import { Document, Packer } from "docx";
import { saveAs } from 'file-saver';
import { createWordDocument } from '../docx';
import { toast } from "@/components/ui/use-toast";

interface DownloadOptionsProps {
  currentTranscript: string;
  fileName: string;
  jsonData?: any;
  autoDownloadWord?: boolean;
}

export const DownloadOptions = ({ 
  currentTranscript, 
  fileName, 
  jsonData,
  autoDownloadWord = false
}: DownloadOptionsProps) => {
  const [copied, setCopied] = useState(false);
  
  // Reset copied state after 2 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (copied) {
      timer = setTimeout(() => setCopied(false), 2000);
    }
    return () => clearTimeout(timer);
  }, [copied]);
  
  // Auto-download Word document when requested
  useEffect(() => {
    if (autoDownloadWord && currentTranscript) {
      console.log("[DOWNLOAD] Auto-downloading Word document triggered");
      downloadWordDocument();
    }
  }, [autoDownloadWord, currentTranscript]);
  
  // Function to copy transcript text to clipboard
  const copyToClipboard = () => {
    if (currentTranscript) {
      navigator.clipboard.writeText(currentTranscript)
        .then(() => {
          setCopied(true);
          toast({
            title: "Copied to clipboard",
            description: "Transcript text has been copied to your clipboard.",
          });
        })
        .catch(err => console.error('[DOWNLOAD] Failed to copy: ', err));
    }
  };

  // Function to download transcript as a text file
  const downloadTranscript = () => {
    if (currentTranscript) {
      console.log("[DOWNLOAD] Downloading transcript as text file:", {
        transcriptLength: currentTranscript.length,
        fileName: `${fileName}.txt`
      });
      
      const element = document.createElement("a");
      const file = new Blob([currentTranscript], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${fileName}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Text File Downloaded",
        description: `Transcript saved as ${fileName}.txt`,
      });
    }
  };

  // Function to download transcript as a Word document
  const downloadWordDocument = () => {
    if (!currentTranscript || currentTranscript.trim().length === 0) {
      console.error("[DOWNLOAD] Cannot create Word document: transcript is empty");
      toast({
        title: "Error",
        description: "Cannot create Word document: transcript is empty",
        variant: "destructive"
      });
      return;
    }
    
    console.log("[DOWNLOAD] Creating Word document:", {
      transcriptLength: currentTranscript.length,
      fileName,
      transcriptSample: currentTranscript.substring(0, 100) + "..."
    });
    
    try {
      const doc = createWordDocument(currentTranscript, fileName);
      
      // Generate and save the file
      Packer.toBlob(doc).then(blob => {
        console.log("[DOWNLOAD] Word document blob created, downloading");
        saveAs(blob, `${fileName}.docx`);
        
        toast({
          title: "Word Document Ready",
          description: `Transcript saved as ${fileName}.docx`,
        });
      }).catch(error => {
        console.error("[DOWNLOAD] Error creating Word document blob:", error);
        toast({
          title: "Document Creation Error",
          description: "Failed to create Word document. Please try again.",
          variant: "destructive"
        });
      });
    } catch (error) {
      console.error("[DOWNLOAD] Error generating Word document:", error);
      toast({
        title: "Document Creation Error",
        description: "Failed to generate Word document. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to download JSON data
  const downloadJsonData = () => {
    if (jsonData) {
      console.log("[DOWNLOAD] Downloading JSON data");
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, `${fileName}_data.json`);
      
      toast({
        title: "JSON Data Downloaded",
        description: `Raw data saved as ${fileName}_data.json`,
      });
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

// Export this function for direct use in transcription.ts
export const downloadWordDocumentDirect = (transcriptText: string, fileName: string): Promise<boolean> => {
  if (!transcriptText || transcriptText.trim().length === 0) {
    console.error("[DOWNLOAD] Cannot create Word document: transcript is empty");
    return Promise.resolve(false);
  }
  
  console.log("[DOWNLOAD] Directly creating Word document:", {
    transcriptLength: transcriptText.length,
    fileName,
    transcriptSample: transcriptText.substring(0, 100) + "..."
  });
  
  try {
    const doc = createWordDocument(transcriptText, fileName);
    
    // Generate and save the file
    return Packer.toBlob(doc).then(blob => {
      console.log("[DOWNLOAD] Word document blob created, initiating download");
      saveAs(blob, `${fileName}.docx`);
      
      // Show toast notification
      toast({
        title: "Transcription Complete",
        description: "Word document has been created and downloaded for your review.",
      });
      
      return true;
    }).catch(error => {
      console.error("[DOWNLOAD] Error creating Word document blob:", error);
      toast({
        title: "Document Creation Error",
        description: "Failed to create Word document. Please try again.",
        variant: "destructive"
      });
      return false;
    });
  } catch (error) {
    console.error("[DOWNLOAD] Error generating Word document:", error);
    toast({
      title: "Document Creation Error",
      description: "Failed to generate Word document. Please try again.",
      variant: "destructive"
    });
    return Promise.resolve(false);
  }
};

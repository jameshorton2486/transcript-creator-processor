
import React from 'react';
import { DownloadOptions } from './DownloadOptions';
import { Button } from '@/components/ui/button';
import { Wand2, FileText } from 'lucide-react';

interface TranscriptToolbarProps {
  currentTranscript: string;
  fileName: string;
  jsonData?: any;
}

export const TranscriptToolbar = ({ currentTranscript, fileName, jsonData }: TranscriptToolbarProps) => {
  if (!currentTranscript) return null;
  
  // Function to handle auto-formatting of legal text
  const handleAutoFormat = () => {
    // This would trigger auto-formatting functionality
    console.log("Auto-format triggered");
    
    // For demo purposes, we would connect this to the TranscriptProcessor component
    const processButton = document.querySelector('[data-format-trigger]');
    if (processButton) {
      (processButton as HTMLElement).click();
    }
  };
  
  return (
    <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium flex items-center">
          <FileText className="h-4 w-4 mr-1 text-slate-600" />
          <span>Transcript Options</span>
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2 flex items-center gap-1 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 border-emerald-200"
          onClick={handleAutoFormat}
        >
          <Wand2 className="h-4 w-4" />
          Auto-Format
        </Button>
      </div>
      <DownloadOptions 
        currentTranscript={currentTranscript}
        fileName={fileName}
        jsonData={jsonData}
      />
    </div>
  );
};

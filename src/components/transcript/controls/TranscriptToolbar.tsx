
import React from 'react';
import { DownloadOptions } from './DownloadOptions';

interface TranscriptToolbarProps {
  currentTranscript: string;
  fileName: string;
  jsonData?: any;
}

export const TranscriptToolbar = ({ currentTranscript, fileName, jsonData }: TranscriptToolbarProps) => {
  if (!currentTranscript) return null;
  
  return (
    <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
      <h3 className="text-sm font-medium">Transcript Options</h3>
      <DownloadOptions 
        currentTranscript={currentTranscript}
        fileName={fileName}
        jsonData={jsonData}
      />
    </div>
  );
};

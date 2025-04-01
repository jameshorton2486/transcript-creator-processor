
import React from 'react';
import { DownloadOptions } from './DownloadOptions';

interface TranscriptToolbarProps {
  currentTranscript: string;
  fileName: string;
  jsonData?: any;
}

export const TranscriptToolbar: React.FC<TranscriptToolbarProps> = ({
  currentTranscript,
  fileName,
  jsonData
}) => {
  return (
    <div className="p-3 border-b bg-white flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="font-medium text-sm">{fileName}</div>
        {currentTranscript && (
          <div className="text-xs text-muted-foreground">
            ({currentTranscript.length.toLocaleString()} characters)
          </div>
        )}
      </div>
      
      <DownloadOptions
        currentTranscript={currentTranscript}
        fileName={fileName}
        jsonData={jsonData}
      />
    </div>
  );
};

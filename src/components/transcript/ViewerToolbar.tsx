
import React from 'react';
import { DownloadOptions } from './controls/DownloadOptions';
import { CardHeader } from "@/components/ui/card";

interface ViewerToolbarProps {
  text: string;
  formattedText: string;
  fileName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  jsonData?: any;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  text,
  formattedText,
  fileName,
  activeTab,
  setActiveTab,
  jsonData
}) => {
  const currentText = activeTab === "formatted" ? formattedText : text;
  
  return (
    <CardHeader className="p-3 border-b flex flex-row items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <div className="font-medium text-sm">{fileName || "transcript"}</div>
        {text && <div className="text-xs text-muted-foreground">
          ({text.length.toLocaleString()} characters)
        </div>}
      </div>
      
      <DownloadOptions
        currentTranscript={currentText}
        fileName={fileName}
        jsonData={jsonData}
      />
    </CardHeader>
  );
};

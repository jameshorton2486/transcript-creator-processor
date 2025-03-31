
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedFileSelector } from '@/components/audio/EnhancedFileSelector';
import { TranscriptionOptions } from './TranscriptionOptions';

interface TranscriptionTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  handleFileSelected: (file: File) => void;
  isTranscribing: boolean;
  handleOptionChange: (name: string, value: any) => void;
}

export const TranscriptionTabs: React.FC<TranscriptionTabsProps> = ({
  activeTab,
  setActiveTab,
  handleFileSelected,
  isTranscribing,
  handleOptionChange
}) => {
  return (
    <Tabs defaultValue="file" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="file">File Upload</TabsTrigger>
        <TabsTrigger value="options">Options</TabsTrigger>
      </TabsList>
      
      <TabsContent value="file" className="space-y-4">
        <EnhancedFileSelector
          onFileSelected={handleFileSelected}
          isLoading={isTranscribing}
          maxSizeMB={250}
          supportedFormats={["mp3", "wav", "m4a", "mp4", "ogg", "flac"]}
        />
      </TabsContent>
      
      <TabsContent value="options">
        <TranscriptionOptions 
          onOptionsChange={handleOptionChange}
          isLoading={isTranscribing}
        />
      </TabsContent>
    </Tabs>
  );
};

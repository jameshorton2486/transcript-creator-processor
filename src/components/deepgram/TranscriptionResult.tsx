
import React from 'react';
import { TranscriptViewer } from '@/components/TranscriptViewer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TranscriptionResult } from '@/lib/deepgram/types';
import { FileText } from 'lucide-react';

interface TranscriptionResultDisplayProps {
  transcription: TranscriptionResult | null;
  selectedFile: File | null;
}

export const TranscriptionResultDisplay: React.FC<TranscriptionResultDisplayProps> = ({
  transcription,
  selectedFile
}) => {
  if (!transcription) {
    return null;
  }
  
  const fileName = selectedFile ? selectedFile.name.split('.')[0] : 'transcript';
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Transcription Result
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TranscriptViewer 
          text={transcription.transcript} 
          fileName={fileName}
          jsonData={transcription}
        />
      </CardContent>
    </Card>
  );
};

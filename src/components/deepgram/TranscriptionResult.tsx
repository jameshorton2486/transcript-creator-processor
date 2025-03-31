
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileAudio } from 'lucide-react';
import { TranscriptionResult as TranscriptionResultType } from '@/lib/deepgram/types';

interface TranscriptionResultProps {
  transcription: TranscriptionResultType | null;
  selectedFile: File | null;
}

export const TranscriptionResultDisplay: React.FC<TranscriptionResultProps> = ({
  transcription,
  selectedFile
}) => {
  if (!transcription) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transcription Result</span>
          {transcription.confidence > 0 && (
            <span className="text-sm font-normal text-slate-500">
              Confidence: {(transcription.confidence * 100).toFixed(1)}%
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-60 overflow-y-auto p-4 bg-slate-50 rounded-md border border-slate-200">
          <p className="text-sm whitespace-pre-wrap">{transcription.transcript}</p>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-slate-500">
        {selectedFile && (
          <div className="flex items-center gap-1">
            <FileAudio className="h-3 w-3" />
            <span>{selectedFile.name}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

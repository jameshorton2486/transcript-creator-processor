
import React from 'react';
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TranscriptionResult } from "@/hooks/useDeepgramTranscription/types";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TranscriptionResultDisplayProps {
  result: TranscriptionResult | null;
  showTranscription: boolean;
  error?: string | null;
}

export const TranscriptionResultDisplay: React.FC<TranscriptionResultDisplayProps> = ({
  result,
  showTranscription,
  error
}) => {
  if (!showTranscription) {
    return null;
  }

  // Display error if there's an issue with transcription
  if (error) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Transcription Error</h3>
          <Separator />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </Card>
    );
  }

  // Show a message if no result is available
  if (!result || !result.transcript || result.transcript.trim().length === 0) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Transcription Result</h3>
          <Separator />
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <AlertDescription>
              No transcript is available. Please ensure your audio file contains speech and try again.
            </AlertDescription>
          </Alert>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Transcription Result</h3>
        <Separator />
        
        <div className="whitespace-pre-wrap bg-slate-50 p-3 rounded-md border border-slate-200 text-sm">
          {result.transcript}
        </div>

        {result.formattedResult?.speakerSegments?.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-md font-medium">Speaker Segments</h4>
            
            <div className="space-y-2">
              {result.formattedResult.speakerSegments.map((seg, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-md border border-slate-200">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-slate-800">{seg.speaker}</span>
                    <span className="text-xs text-slate-500">
                      {formatTime(seg.start)} - {formatTime(seg.end)}
                    </span>
                  </div>
                  <p className="text-sm">{seg.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

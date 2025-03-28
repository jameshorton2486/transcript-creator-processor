
import React from 'react';
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TranscriptionResult } from "@/hooks/useDeepgramTranscription/types";

interface TranscriptionResultDisplayProps {
  result: TranscriptionResult | null;
  showTranscription: boolean;
}

export const TranscriptionResultDisplay: React.FC<TranscriptionResultDisplayProps> = ({
  result,
  showTranscription
}) => {
  if (!showTranscription || !result) {
    return null;
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

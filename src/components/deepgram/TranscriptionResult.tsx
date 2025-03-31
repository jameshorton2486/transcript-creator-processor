
import React from 'react';
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TranscriptionResult, FormattedTranscript } from "@/lib/deepgram/types";
import { AlertCircle, Copy, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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

  // Get the formatted result if available
  const formattedResult = result.formattedResult;
  const hasSpeakerSegments = 
    typeof formattedResult !== 'string' && 
    formattedResult?.speakerSegments && 
    formattedResult.speakerSegments.length > 0;

  const copyTranscriptToClipboard = () => {
    if (result?.transcript) {
      navigator.clipboard.writeText(result.transcript)
        .then(() => {
          alert('Transcript copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy transcript:', err);
        });
    }
  };

  const downloadTranscriptAsText = () => {
    if (!result?.transcript) return;
    
    const blob = new Blob([result.transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Transcription Result</h3>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={copyTranscriptToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy transcript</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={downloadTranscriptAsText}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download transcript</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <Separator />
        
        <div className="whitespace-pre-wrap bg-slate-50 p-3 rounded-md border border-slate-200 text-sm">
          {result.transcript}
        </div>

        {hasSpeakerSegments && (
          <div className="space-y-3">
            <h4 className="text-md font-medium">Speaker Segments</h4>
            
            <div className="space-y-2">
              {typeof formattedResult !== 'string' && formattedResult?.speakerSegments?.map((seg, idx) => (
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

        {result.confidence > 0 && (
          <div className="text-sm text-slate-500 text-right">
            Confidence: {(result.confidence * 100).toFixed(1)}%
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

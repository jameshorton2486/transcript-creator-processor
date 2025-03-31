
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ErrorDisplay from '@/components/audio/ErrorDisplay';
import { shouldUseMockResponses } from '@/lib/deepgram/mockDeepgramService';
import type { TranscriptionResult } from '@/lib/deepgram/types';

interface TranscriptionResultDisplayProps {
  result: TranscriptionResult | null;
  error: string | null;
  showTranscription?: boolean;
}

export const TranscriptionResultDisplay = ({
  result,
  showTranscription = true,
  error
}) => {
  // Safely check for mock data by wrapping in try/catch to handle potential errors
  const isMockData = React.useMemo(() => {
    try {
      return shouldUseMockResponses();
    } catch (err) {
      console.error('Error checking mock response status:', err);
      return false;
    }
  }, []);

  if (!showTranscription) {
    return null;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!result) {
    return null;
  }

  // Extract speaker segments if available
  const speakerSegments = typeof result.formattedResult === 'object' && 
    result.formattedResult?.speakerSegments?.length ? 
    result.formattedResult.speakerSegments : null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transcription Result</span>
          {isMockData && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
              Mock Data
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="transcript" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="transcript">Plain Transcript</TabsTrigger>
            {speakerSegments && (
              <TabsTrigger value="speakers">Speaker Segments</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="transcript">
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="text-sm whitespace-pre-wrap">
                {result.transcript}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {speakerSegments && (
            <TabsContent value="speakers">
              <ScrollArea className="h-[300px] w-full rounded-md border">
                <div className="p-4 space-y-4">
                  {speakerSegments.map((segment, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-medium">
                          {segment.speaker}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(segment.start)} - {formatTimestamp(segment.end)}
                        </span>
                      </div>
                      <p className="text-sm pl-1">{segment.text}</p>
                      {i < speakerSegments.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Helper function to format timestamps
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

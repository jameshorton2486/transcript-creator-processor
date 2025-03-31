
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface TranscriptionProgressProps {
  isTranscribing: boolean;
}

export const TranscriptionProgress: React.FC<TranscriptionProgressProps> = ({
  isTranscribing
}) => {
  if (!isTranscribing) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Processing audio...</span>
        <span className="text-slate-500">This may take a minute</span>
      </div>
      <Progress value={100} className="h-2 animate-pulse" />
    </div>
  );
};

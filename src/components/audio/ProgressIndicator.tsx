
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  progress: number;
  isVisible: boolean;
}

export const ProgressIndicator = ({ progress, isVisible }: ProgressIndicatorProps) => {
  if (!isVisible) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Processing audio with format-specific handling</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-slate-500 italic">
        Audio is being processed with format-specific optimizations and dynamic sample rate detection.
        The system automatically adjusts processing methods based on your file format (MP3, WAV, FLAC, etc.)
        for the best transcription quality.
      </p>
    </div>
  );
};

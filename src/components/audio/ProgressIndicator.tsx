
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
      <div className="mt-2 text-xs text-slate-600 grid grid-cols-2 gap-x-4 gap-y-1">
        <div>✓ Dynamic sample rate detection</div>
        <div>✓ Batch processing for large files</div>
        <div>✓ Memory-efficient processing</div>
        <div>✓ Direct API upload fallback</div>
      </div>
    </div>
  );
};

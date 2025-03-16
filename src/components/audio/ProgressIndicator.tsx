
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
        <span>Processing in batches</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-slate-500 italic">
        Large files are processed in chunks. Please be patient.
      </p>
    </div>
  );
};

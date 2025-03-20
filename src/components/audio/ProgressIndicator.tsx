
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  progress: number;
  isVisible: boolean;
  label?: string;
}

export const ProgressIndicator = ({ progress, isVisible, label }: ProgressIndicatorProps) => {
  if (!isVisible) return null;
  
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium text-slate-700">{label} ({progress}%)</p>
      )}
      <Progress value={progress} className="h-2" />
    </div>
  );
};

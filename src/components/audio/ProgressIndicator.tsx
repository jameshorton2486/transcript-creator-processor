
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  progress: number;
  isVisible: boolean;
  label?: string;
}

export const ProgressIndicator = ({ progress, isVisible, label }: ProgressIndicatorProps) => {
  if (!isVisible || progress <= 0) return null;
  
  // Ensure progress is capped between 0 and 100
  const normalizedProgress = Math.min(Math.max(Math.round(progress), 0), 100);
  
  // Don't show if processing is complete
  if (normalizedProgress >= 100) return null;
  
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium text-slate-700">{label} ({normalizedProgress}%)</p>
      )}
      <Progress value={normalizedProgress} className="h-2" />
    </div>
  );
};

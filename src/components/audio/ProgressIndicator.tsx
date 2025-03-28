
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  progress: number;
  isVisible: boolean;
  label?: string;
}

export const ProgressIndicator = ({ progress, isVisible, label }: ProgressIndicatorProps) => {
  // Don't show if not visible or progress is not valid
  if (!isVisible) return null;
  
  // Ensure progress is capped between 0 and 100
  const normalizedProgress = Math.min(Math.max(Math.round(progress), 0), 100);
  
  // Don't show complete progress as it's likely transitory
  if (normalizedProgress >= 100) return null;
  
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm font-medium text-slate-700">
            {label} ({normalizedProgress}%)
          </p>
        </div>
      )}
      <Progress value={normalizedProgress} className="h-2" />
    </div>
  );
};

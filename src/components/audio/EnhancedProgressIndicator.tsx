
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  progress: number;
  isVisible: boolean;
  label?: string;
}

/**
 * ProgressIndicator Component
 * 
 * Displays a progress bar with an optional label to indicate the status
 * of an ongoing operation like transcription.
 */
export const EnhancedProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  isVisible,
  label = "Processing..."
}) => {
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Ensure progress is within bounds 0-100
  const boundedProgress = Math.max(0, Math.min(100, progress));
  
  // Format progress for display
  const formattedProgress = Math.round(boundedProgress);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center text-sm text-slate-600">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span>{label}</span>
        </div>
        <span className="text-sm font-medium">{formattedProgress}%</span>
      </div>
      
      <Progress 
        value={boundedProgress} 
        className="h-2 bg-slate-200" 
      />
      
      {formattedProgress < 100 && formattedProgress > 0 && (
        <p className="text-xs text-slate-500 mt-1">
          Please keep this window open until transcription is complete
        </p>
      )}
    </div>
  );
};

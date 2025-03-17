
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DocumentProcessingIndicatorProps {
  isLoading: boolean;
  progress: number;
  processedFiles: number;
  totalFiles: number;
}

export const DocumentProcessingIndicator = ({
  isLoading,
  progress,
  processedFiles,
  totalFiles
}: DocumentProcessingIndicatorProps) => {
  if (!isLoading) return null;
  
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p className="text-sm">
          Processing {totalFiles > 0 ? `document ${processedFiles + 1} of ${totalFiles}` : 'document'}...
        </p>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

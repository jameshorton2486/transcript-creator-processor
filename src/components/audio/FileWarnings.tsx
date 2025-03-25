
import { MemoryWarningAlert } from "@/components/audio/MemoryWarningAlert";
import { LargeFileAlert } from "@/components/audio/LargeFileAlert";

interface FileWarningsProps {
  memoryWarning: string | null;
  durationWarning: string | null;
  file: File | null;
  isLoading: boolean;
  fileSizeMB: string;
  memoryThreshold: number;
}

export const FileWarnings = ({ 
  memoryWarning, 
  durationWarning, 
  file, 
  isLoading, 
  fileSizeMB,
  memoryThreshold 
}: FileWarningsProps) => {
  return (
    <>
      <MemoryWarningAlert warningMessage={memoryWarning} />
      
      {durationWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
          <p>{durationWarning}</p>
        </div>
      )}
      
      <LargeFileAlert 
        isVisible={!!file && file.size > memoryThreshold && !isLoading} 
        fileSizeMB={fileSizeMB}
      />
    </>
  );
};

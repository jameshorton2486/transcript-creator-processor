import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FileText } from "lucide-react";

interface TranscribeDebugToolsProps {
  onLoadSample: () => void;
}

export const TranscribeDebugTools = ({ onLoadSample }: TranscribeDebugToolsProps) => {
  const { toast } = useToast();
  
  const handleLoadSample = () => {
    console.log("Loading sample transcript from debug tools");
    onLoadSample();
    toast({
      title: "Sample Transcript Loaded",
      description: "A test transcript has been loaded for debugging.",
    });
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-sm font-medium">Debugging Tools</h3>
      <p className="text-xs text-gray-500 mb-2">
        If you're having trouble with transcripts not displaying, you can load a sample transcript.
      </p>
      <Button 
        onClick={handleLoadSample}
        className="w-full flex items-center gap-2"
        variant="outline"
      >
        <FileText className="h-4 w-4" />
        Load Sample Transcript
      </Button>
    </div>
  );
};

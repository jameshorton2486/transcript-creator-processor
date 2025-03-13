
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Copy } from "lucide-react";

interface TranscriptViewerProps {
  text: string;
}

export const TranscriptViewer = ({ text }: TranscriptViewerProps) => {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "The transcript has been copied to your clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border rounded-md">
      <div className="flex justify-between items-center p-3 border-b bg-slate-50">
        <h3 className="font-medium text-slate-700">Transcript</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="flex items-center gap-1"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
      </div>
      <ScrollArea className="h-[500px] p-4">
        <div className="whitespace-pre-wrap font-mono text-sm text-slate-800 leading-relaxed">
          {text || "No text available"}
        </div>
      </ScrollArea>
    </div>
  );
};

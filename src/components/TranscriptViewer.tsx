
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Download, FileText } from "lucide-react";

interface TranscriptViewerProps {
  text: string;
  fileName?: string;
}

export const TranscriptViewer = ({ text, fileName = "transcript" }: TranscriptViewerProps) => {
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

  const downloadTranscript = () => {
    try {
      const element = document.createElement("a");
      const file = new Blob([text], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `${fileName}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Download started",
        description: "The transcript is being downloaded to your device.",
      });
    } catch (err) {
      console.error("Failed to download:", err);
      toast({
        title: "Download failed",
        description: "Could not download the transcript. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to format the transcript for better display
  const formatTranscript = (text: string) => {
    if (!text) return "No text available";
    
    // Remove duplicate lines that often occur in raw transcripts
    const lines = text.split('\n');
    const uniqueLines: string[] = [];
    let prevContent = '';
    
    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      
      // Skip empty lines and duplicate content
      if (currentLine && currentLine !== prevContent) {
        uniqueLines.push(currentLine);
        prevContent = currentLine;
      }
    }
    
    let cleanedText = uniqueLines.join('\n');
    
    // Format common legal transcript patterns
    cleanedText = cleanedText
      // Format standard legal case citations
      .replace(/([A-Za-z]+)\s+v\.?\s+([A-Za-z]+)/g, '<span class="font-semibold">$1 v. $2</span>')
      
      // Format legal statute references
      .replace(/(\d+)\s+U\.S\.C\.\s+§\s+(\d+)/gi, '<span class="font-semibold">$1 U.S.C. § $2</span>')
      
      // Format case numbers
      .replace(/case\s+no\.\s+([A-Za-z0-9\-]+)/gi, 'Case No. <span class="font-semibold">$1</span>')
      
      // Format docket numbers
      .replace(/docket\s+no\.\s+([A-Za-z0-9\-]+)/gi, 'Docket No. <span class="font-semibold">$1</span>')
      
      // Format exhibit references
      .replace(/exhibit\s+([A-Za-z0-9\-]+)/gi, 'Exhibit <span class="font-semibold">$1</span>');
    
    // Identify and format speaker labels with different colors for each speaker
    const speakerRegex = /(Speaker \d+:|THE COURT:|[A-Z][A-Z\s']+(?:'S COUNSEL|COUNSEL)?:)/g;
    
    // Get all unique speakers
    const speakers = Array.from(new Set(cleanedText.match(speakerRegex) || []));
    const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-red-600', 'text-amber-600'];
    
    // Replace each speaker with a colored version
    speakers.forEach((speaker, index) => {
      const colorClass = colors[index % colors.length];
      const escapedSpeaker = speaker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleanedText = cleanedText.replace(
        new RegExp(`(${escapedSpeaker})`, 'g'),
        `<span class="font-bold ${colorClass}">$1</span>`
      );
    });
    
    // Add proper line breaks and indentation for readability
    cleanedText = cleanedText
      // Add paragraph breaks after consecutive sentences
      .replace(/(\.)(\s*)([A-Z])/g, '$1<br />$3')
      // Add indentation after speaker labels
      .replace(/(class="font-bold [^"]+">.*?:)(\s*)/g, '$1</span><br /><span class="pl-4">');
    
    return cleanedText;
  };

  return (
    <div className="border rounded-md h-full flex flex-col">
      <div className="flex justify-between items-center p-3 border-b bg-slate-50">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-500" />
          <h3 className="font-medium text-slate-700">Transcript</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTranscript}
            className="flex items-center gap-1"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
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
      </div>
      <ScrollArea className="flex-1 p-4 min-h-[600px]">
        <div 
          className="whitespace-pre-wrap font-mono text-sm text-slate-800 leading-relaxed text-left"
          dangerouslySetInnerHTML={{ __html: formatTranscript(text) }}
        />
      </ScrollArea>
    </div>
  );
};

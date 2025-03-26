
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Packer } from "docx";
import { saveAs } from "file-saver";
import { createWordDocument } from "@/components/transcript/docx";
import { useToast } from "@/components/ui/use-toast";

interface TranscribeDownloadOptionsProps {
  originalTranscript: string;
  currentTranscript: string;
  fileName: string;
}

export const TranscribeDownloadOptions = ({
  originalTranscript,
  currentTranscript,
  fileName,
}: TranscribeDownloadOptionsProps) => {
  const { toast } = useToast();

  const downloadWordDocument = () => {
    if (!originalTranscript) {
      toast({
        title: "No transcript available",
        description: "Please transcribe an audio file first.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Downloading transcript:", {
      transcriptLength: currentTranscript.length,
      transcriptSample: currentTranscript.substring(0, 100)
    });
    
    const doc = createWordDocument(currentTranscript, fileName);
    
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `${fileName}.docx`);
      toast({
        title: "Download Complete",
        description: "Word document has been downloaded.",
      });
    }).catch(error => {
      console.error("Error creating Word document:", error);
      toast({
        title: "Download Failed",
        description: "Failed to create Word document. Please try again.",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-sm font-medium">Download Options</h3>
      <p className="text-xs text-gray-500 mb-2">
        Your transcript has been created and should have downloaded automatically.
        If you need to download it again, click the button below.
      </p>
      <Button 
        onClick={downloadWordDocument}
        className="w-full flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download Word Document
      </Button>
    </div>
  );
};

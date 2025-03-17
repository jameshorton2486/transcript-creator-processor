
import { CheckCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ExtractedTextPreviewProps {
  extractedText: string;
}

export const ExtractedTextPreview = ({ extractedText }: ExtractedTextPreviewProps) => {
  if (!extractedText) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <p>Documents processed successfully</p>
      </div>
      
      <Label htmlFor="extracted-text">Extracted Text Preview</Label>
      <Textarea
        id="extracted-text"
        value={extractedText.slice(0, 500) + (extractedText.length > 500 ? '...' : '')}
        readOnly
        className="h-24 text-xs"
      />
    </div>
  );
};

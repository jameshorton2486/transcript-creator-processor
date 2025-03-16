
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { DocumentTerminologyExtractor } from "./DocumentTerminologyExtractor";

interface TerminologyExtractorProps {
  onTermsExtracted: (terms: string[]) => void;
  documentFile?: File | null;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

export const TerminologyExtractor = ({ 
  onTermsExtracted, 
  documentFile = null,
  isLoading = false,
  setIsLoading = () => {}
}: TerminologyExtractorProps) => {
  const [manualText, setManualText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>(documentFile ? "document" : "manual");
  const { toast } = useToast();

  const extractTermsFromText = () => {
    if (!manualText.trim()) {
      toast({
        title: "No text provided",
        description: "Please enter some text to extract terminology from.",
        variant: "destructive",
      });
      return;
    }

    // Split the text into words
    const words = manualText
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(word => word.length > 0);

    // Filter out common words and duplicates
    const commonWords = new Set(["the", "and", "that", "have", "for", "not", "with", "you", "this"]);
    const uniqueTerms = Array.from(
      new Set(
        words.filter(
          word => word.length > 2 && !commonWords.has(word) && isNaN(Number(word))
        )
      )
    );

    onTermsExtracted(uniqueTerms);

    toast({
      title: "Terms Extracted",
      description: `Successfully extracted ${uniqueTerms.length} unique terms.`,
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Input</TabsTrigger>
          <TabsTrigger value="document">From Document</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="terminology-text">Enter text with specialized terminology</Label>
            <Textarea
              id="terminology-text"
              placeholder="Paste your text here to extract important terms..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="min-h-32"
            />
          </div>
          
          <Button 
            onClick={extractTermsFromText} 
            variant="secondary"
            disabled={!manualText.trim()}
            className="w-full"
          >
            Extract Terms
          </Button>
        </TabsContent>
        
        <TabsContent value="document">
          <DocumentTerminologyExtractor 
            documentFile={documentFile}
            onTermsExtracted={onTermsExtracted}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

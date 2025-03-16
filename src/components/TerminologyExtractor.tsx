import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
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
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
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

    // Extract potential terms from the manual text input
    const terms = extractPotentialTermsFromText(manualText);

    onTermsExtracted(terms);

    toast({
      title: "Terms Extracted",
      description: `Successfully extracted ${terms.length} unique terms.`,
    });
  };

  // Handle when multiple files are uploaded
  const handleFilesChange = (files: File[]) => {
    setDocumentFiles(files);
  };

  // Improved term extraction logic
  const extractPotentialTermsFromText = (text: string): string[] => {
    // Remove common words, numbers, and punctuation
    const cleanedText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    
    // Split into words
    const words = cleanedText.split(/\s+/).filter(word => word.length > 0);
    
    // Define a comprehensive list of common words to filter out
    const commonWords = new Set([
      // Common legal terms to exclude
      'number', 'date', 'location', 'witness', 'videographer', 'interpreter', 
      'attorney', 'info', 'present', 'insured', 'name', 'insurer', 'claim', 
      'policy', 'loss', 'exhibits', 'description', 'jose', 'zambrano', 
      'friday', 'depo', 'notes', 'page',
      
      // Common English words
      'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 
      'but', 'his', 'from', 'they', 'say', 'her', 'she', 'will', 'one', 
      'all', 'would', 'there', 'their', 'what', 'out', 'about', 'who', 
      'get', 'which', 'when', 'make', 'can', 'like', 'time', 'just', 
      'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 
      'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 
      'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 
      'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 
      'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 
      'day', 'most', 'been'
    ]);
    
    // First pass: try to identify proper nouns (capitalized words not at the beginning of sentences)
    const properNouns = new Set<string>();
    const wordRegex = /\b([A-Z][a-z]+)\b(?!\s*[\.!\?])/g;
    let match;
    
    while ((match = wordRegex.exec(text)) !== null) {
      if (!commonWords.has(match[1].toLowerCase())) {
        properNouns.add(match[1]);
      }
    }
    
    // Second pass: filter out common words and find important words by frequency
    const wordFrequency: {[key: string]: number} = {};
    words.forEach(word => {
      if (word.length >= 3 && !commonWords.has(word) && isNaN(Number(word))) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });
    
    // Get unique words sorted by frequency
    const frequentWords = Object.keys(wordFrequency)
      .filter(word => wordFrequency[word] >= 2) // Only words that appear at least twice
      .sort((a, b) => wordFrequency[b] - wordFrequency[a]);
    
    // Combine proper nouns and frequent words
    const combinedTerms = [...properNouns, ...frequentWords];
    
    // Remove duplicates (case-insensitive)
    const lowerCaseMap = new Map<string, string>();
    combinedTerms.forEach(term => {
      const lowerTerm = term.toLowerCase();
      // Keep the capitalized version if it exists
      if (!lowerCaseMap.has(lowerTerm) || term[0] === term[0].toUpperCase()) {
        lowerCaseMap.set(lowerTerm, term);
      }
    });
    
    // Return unique terms (up to 75)
    return Array.from(lowerCaseMap.values()).slice(0, 75);
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
            documentFiles={documentFiles}
            onTermsExtracted={onTermsExtracted}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onFilesChange={handleFilesChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

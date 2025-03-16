
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface DocumentTerminologyExtractorProps {
  documentFile: File | null;
  onTermsExtracted: (terms: string[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const DocumentTerminologyExtractor = ({
  documentFile,
  onTermsExtracted,
  isLoading,
  setIsLoading
}: DocumentTerminologyExtractorProps) => {
  const [extractedText, setExtractedText] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (documentFile) {
      processDocument(documentFile);
    }
  }, [documentFile]);

  const processDocument = async (file: File) => {
    setIsLoading(true);
    setProgress(10);
    
    try {
      let text = "";
      
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        text = await extractTextFromPDF(file);
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        file.name.endsWith(".docx") ||
        file.type === "application/msword" ||
        file.name.endsWith(".doc")
      ) {
        text = await extractTextFromWord(file);
      } else {
        throw new Error("Unsupported file format. Please upload a PDF or Word document.");
      }
      
      setProgress(70);
      setExtractedText(text);
      
      // Extract potential terms (words that might be important)
      const terms = extractPotentialTermsFromText(text);
      setProgress(100);
      
      if (terms.length > 0) {
        onTermsExtracted(terms);
        toast({
          title: "Terminology Extracted",
          description: `Successfully extracted ${terms.length} terms from the document.`,
        });
      } else {
        toast({
          title: "No Terms Found",
          description: "Could not find any significant terms in the document.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Document processing error:", error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map((item: any) => item.str).join(' ');
        fullText += textItems + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error("PDF extraction error:", error);
      throw new Error("Failed to extract text from PDF");
    }
  };

  const extractTextFromWord = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error("Word extraction error:", error);
      throw new Error("Failed to extract text from Word document");
    }
  };

  const extractPotentialTermsFromText = (text: string): string[] => {
    // Remove common words, numbers, and punctuation
    const cleanedText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    
    // Split into words
    const words = cleanedText.split(/\s+/).filter(word => word.length > 0);
    
    // Filter out common words and short words (less than 4 characters)
    const commonWords = new Set(['the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but', 'his', 'from', 'they', 'say', 'her', 'she', 'will', 'one', 'all', 'would', 'there', 'their', 'what', 'out', 'about', 'who', 'get', 'which', 'when', 'make', 'can', 'like', 'time', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'been']);
    
    const filteredWords = words.filter(word => 
      word.length >= 4 && 
      !commonWords.has(word) && 
      isNaN(Number(word))
    );
    
    // Count frequency
    const wordFrequency: {[key: string]: number} = {};
    filteredWords.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    // Get unique words sorted by frequency
    const uniqueWords = Object.keys(wordFrequency).sort((a, b) => wordFrequency[b] - wordFrequency[a]);
    
    // Take the top 50 words or all if less than 50
    return uniqueWords.slice(0, 50);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm">Processing document...</p>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    );
  }

  if (!documentFile) {
    return (
      <div className="text-sm text-slate-500 flex items-center gap-2 py-2">
        <FileText className="h-4 w-4" />
        <p>Upload a document to extract terminology</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <p>Document processed successfully</p>
      </div>
      
      {extractedText && (
        <div className="space-y-2">
          <Label htmlFor="extracted-text">Extracted Text Preview</Label>
          <Textarea
            id="extracted-text"
            value={extractedText.slice(0, 500) + (extractedText.length > 500 ? '...' : '')}
            readOnly
            className="h-24 text-xs"
          />
        </div>
      )}
    </div>
  );
};

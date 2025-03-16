import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle, Loader2 } from "lucide-react";
import { FileUploader } from "./FileUploader";

interface DocumentTerminologyExtractorProps {
  documentFile: File | null;
  documentFiles: File[];
  onTermsExtracted: (terms: string[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onFilesChange: (files: File[]) => void;
}

export const DocumentTerminologyExtractor = ({
  documentFile,
  documentFiles,
  onTermsExtracted,
  isLoading,
  setIsLoading,
  onFilesChange
}: DocumentTerminologyExtractorProps) => {
  const [extractedText, setExtractedText] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [processedFiles, setProcessedFiles] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (documentFiles.length > 0) {
      processDocuments(documentFiles);
    } else if (documentFile) {
      processDocuments([documentFile]);
    }
  }, [documentFiles, documentFile]);

  const processDocuments = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsLoading(true);
    setProgress(0);
    setProcessedFiles(0);
    
    try {
      let allText = "";
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessedFiles(i);
        
        // Update progress based on current file and total files
        const fileProgress = (i / files.length) * 100;
        setProgress(fileProgress);
        
        let fileText = "";
        
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          fileText = await extractTextFromPDF(file);
        } else if (
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
          file.name.endsWith(".docx") ||
          file.type === "application/msword" ||
          file.name.endsWith(".doc")
        ) {
          fileText = await extractTextFromWord(file);
        } else {
          console.warn(`Unsupported file format: ${file.type} - ${file.name}`);
          continue;
        }
        
        allText += fileText + "\n\n";
      }
      
      setExtractedText(allText);
      
      // Extract potential terms (words that might be important)
      const terms = extractPotentialTermsFromText(allText);
      setProgress(100);
      
      if (terms.length > 0) {
        onTermsExtracted(terms);
        toast({
          title: "Terminology Extracted",
          description: `Successfully extracted ${terms.length} terms from ${files.length} document${files.length > 1 ? 's' : ''}.`,
        });
      } else {
        toast({
          title: "No Terms Found",
          description: "Could not find any significant terms in the documents.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Document processing error:", error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process documents",
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
      'day', 'most', 'been', 'much', 'does', 'those', 'off', 'again',
      'down', 'should', 'still', 'find', 'through', 'same', 'said'
    ]);
    
    // First pass: identify proper nouns (capitalized words not at the beginning of sentences)
    const properNouns = new Set<string>();
    const wordRegex = /\b([A-Z][a-z]+)\b(?!\s*[\.!\?])/g;
    let match;
    
    while ((match = wordRegex.exec(text)) !== null) {
      if (!commonWords.has(match[1].toLowerCase())) {
        properNouns.add(match[1]);
      }
    }
    
    // Second pass: find important words by frequency
    const wordFrequency: {[key: string]: number} = {};
    words.forEach(word => {
      if (!commonWords.has(word) && word.length >= 3 && isNaN(Number(word))) {
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
    
    // Return unique terms (up to 50)
    return Array.from(lowerCaseMap.values()).slice(0, 75);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm">
            Processing {documentFiles.length > 0 ? `document ${processedFiles + 1} of ${documentFiles.length}` : 'document'}...
          </p>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FileUploader 
        files={documentFiles}
        onFileChange={onFilesChange}
        acceptedFileTypes=".pdf,.docx,.doc"
        multiple={true}
      />
      
      {extractedText && (
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
      )}
    </div>
  );
};

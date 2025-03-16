
import { useState, useEffect } from "react";
import { FileUploader } from "@/components/FileUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

interface TerminologyExtractorProps {
  onTermsExtracted: (terms: string[]) => void;
}

export const TerminologyExtractor = ({ onTermsExtracted }: TerminologyExtractorProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedTerms, setExtractedTerms] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    // Reset terms when a new file is selected
    setExtractedTerms([]);
  };

  useEffect(() => {
    // Reset progress when extraction starts/stops
    if (!isExtracting) {
      setProgress(0);
    }
  }, [isExtracting]);

  const extractTerminology = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a document to extract terminology.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    setProgress(10); // Start progress indication

    try {
      // Determine file type and extract content accordingly
      let text = "";
      
      if (file.type === "application/pdf") {
        setProgress(20);
        toast({
          title: "Processing PDF",
          description: "Extracting text from PDF document...",
        });
        text = await extractTextFromPDF(file);
      } 
      else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
               file.type === "application/msword") {
        setProgress(20);
        toast({
          title: "Processing Word document",
          description: "Extracting text from Word document...",
        });
        text = await extractTextFromWord(file);
      } 
      else {
        // Plain text or other supported text formats
        text = await readFileContent(file);
      }
      
      setProgress(60);
      
      // Extract potential terms (names, legal terms, etc.)
      const terms = extractPotentialTerms(text);
      
      setProgress(90);
      setExtractedTerms(terms);
      onTermsExtracted(terms);
      
      setProgress(100);
      toast({
        title: "Terminology extracted",
        description: `${terms.length} terms extracted from the document.`,
      });
    } catch (error) {
      console.error("Error extracting terminology:", error);
      toast({
        title: "Extraction failed",
        description: "Failed to extract terminology from the document. " + 
                     (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const removeTerm = (termToRemove: string) => {
    const updatedTerms = extractedTerms.filter(term => term !== termToRemove);
    setExtractedTerms(updatedTerms);
    onTermsExtracted(updatedTerms);
  };

  // Extract text from PDF file using pdf.js
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        text += pageText + " ";
      }
      
      return text;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error("Failed to extract text from PDF file");
    }
  };

  // Extract text from Word document
  const extractTextFromWord = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error("Error extracting text from Word document:", error);
      throw new Error("Failed to extract text from Word document");
    }
  };

  // Helper function to read file content for text files
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("File reading error"));
      };
      
      reader.readAsText(file);
    });
  };

  // Simple extraction logic - in a real app, this would be more sophisticated
  const extractPotentialTerms = (text: string): string[] => {
    // Mock extraction - in production, you'd use NER or other advanced techniques
    // This is a simplified version that looks for capitalized phrases and legal terms
    
    const potentialTerms = new Set<string>();
    
    // Look for capitalized words that might be names
    const nameRegex = /\b[A-Z][a-z]+ (?:[A-Z][a-z]+ )*[A-Z][a-z]+\b/g;
    const nameMatches = text.match(nameRegex) || [];
    
    // Look for potential legal entities (Firms, LLC, etc.)
    const legalEntityRegex = /\b[A-Z][a-z]+(?: & [A-Z][a-z]+| [A-Z][a-z]+)*(?: LLC| LLP| Inc\.| P\.C\.)\b/g;
    const legalMatches = text.match(legalEntityRegex) || [];
    
    // Common legal terms
    const legalTerms = [
      "plaintiff", "defendant", "counsel", "attorney", "witness", "testimony",
      "exhibit", "evidence", "deposition", "affidavit", "interrogatory",
      "motion", "brief", "pleading", "complaint", "answer", "discovery",
      "judgment", "verdict", "settlement", "stipulation"
    ];
    
    // Add all potential terms to the set
    [...nameMatches, ...legalMatches].forEach(term => {
      if (term.length > 4) { // Exclude very short terms
        potentialTerms.add(term);
      }
    });
    
    // Add capitalized legal terms from the text
    legalTerms.forEach(term => {
      const capitalizedTerm = term.charAt(0).toUpperCase() + term.slice(1);
      if (text.includes(capitalizedTerm)) {
        potentialTerms.add(capitalizedTerm);
      }
    });
    
    // Convert set to array and limit to first 20 terms
    return Array.from(potentialTerms).slice(0, 20);
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <CardTitle>Extract Legal Terminology</CardTitle>
        <CardDescription>
          Upload documents to extract names and legal terms for improved transcription accuracy
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <FileUploader
          onFileChange={handleFileChange}
          file={file}
          acceptedFileTypes=".txt,.pdf,.docx,.doc"
        />
        
        {isExtracting && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Extracting terminology...</p>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        <Button 
          onClick={extractTerminology} 
          disabled={!file || isExtracting}
          className="w-full"
        >
          <FileText className="mr-2 h-4 w-4" />
          {isExtracting ? "Extracting Terms..." : "Extract Terminology"}
        </Button>
        
        {extractedTerms.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Extracted Terms ({extractedTerms.length})</h3>
            <div className="flex flex-wrap gap-2">
              {extractedTerms.map((term, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {term}
                  <button 
                    onClick={() => removeTerm(term)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

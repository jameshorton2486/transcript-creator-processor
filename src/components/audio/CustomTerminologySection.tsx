
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TerminologyExtractor } from "@/components/TerminologyExtractor";
import { FileUploader } from "@/components/FileUploader";

interface CustomTerminologySectionProps {
  customTerms: string[];
  setCustomTerms: (terms: string[]) => void;
}

export const CustomTerminologySection = ({ customTerms, setCustomTerms }: CustomTerminologySectionProps) => {
  const [showTerminologyExtractor, setShowTerminologyExtractor] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isExtractingTerms, setIsExtractingTerms] = useState(false);
  
  const handleTermsExtracted = (terms: string[]) => {
    setCustomTerms(terms);
    setIsExtractingTerms(false);
    console.log(`[TERMINOLOGY] Extracted ${terms.length} custom terms for speech adaptation`);
  };

  const removeTerm = (termToRemove: string) => {
    setCustomTerms(customTerms.filter(term => term !== termToRemove));
    console.log(`[TERMINOLOGY] Removed term: ${termToRemove}`);
  };

  const handleDocumentUpload = (files: File[]) => {
    if (!files.length) return;
    
    // Just use the first file for now for backward compatibility
    const file = files[0];
    setDocumentFile(file);
    setIsExtractingTerms(true);
    
    console.log(`[DOCUMENT] Processing document for terminology extraction: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
    
    try {
      // The TerminologyExtractor component will handle the actual extraction
      // This is just to trigger the visual state
      setTimeout(() => {
        setShowTerminologyExtractor(true);
      }, 100);
    } catch (error) {
      console.error(`[DOCUMENT ERROR] Error processing document:`, error);
      setIsExtractingTerms(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Custom Terminology</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowTerminologyExtractor(!showTerminologyExtractor)}
        >
          {showTerminologyExtractor ? "Hide" : "Show"} Tools
        </Button>
      </div>
      
      <Separator />
      
      {showTerminologyExtractor && (
        <div className="space-y-4 p-3 bg-slate-50 rounded-md">
          <div className="text-sm">
            <p className="font-medium mb-2">Upload document with terminology</p>
            <p className="text-xs text-slate-500 mb-3">
              Extract custom terms from PDF or Word documents to improve transcription accuracy
            </p>
            
            <FileUploader
              files={documentFile ? [documentFile] : []}
              onFileChange={handleDocumentUpload}
              acceptedFileTypes=".pdf,.docx,.doc"
            />
          </div>
          
          <Separator className="my-3" />
          
          <TerminologyExtractor 
            onTermsExtracted={handleTermsExtracted} 
            documentFile={documentFile}
            isLoading={isExtractingTerms}
            setIsLoading={setIsExtractingTerms}
          />
        </div>
      )}
      
      {customTerms.length > 0 && (
        <div className="p-3 bg-slate-50 rounded-md">
          <h3 className="text-sm font-medium mb-2">
            Speech Adaptation Terms ({customTerms.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {customTerms.map((term, index) => (
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
    </div>
  );
};

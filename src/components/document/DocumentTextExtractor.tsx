
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { FileUploader } from "@/components/FileUploader";
import { DocumentProcessingIndicator } from "./DocumentProcessingIndicator";
import { ExtractedTextPreview } from "./ExtractedTextPreview";
import { extractTextFromPDF, extractTextFromWord, extractPotentialTermsFromText } from "@/utils/textExtractionUtils";

interface DocumentTextExtractorProps {
  documentFile: File | null;
  documentFiles: File[];
  onTermsExtracted: (terms: string[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onFilesChange: (files: File[]) => void;
}

export const DocumentTextExtractor = ({
  documentFile,
  documentFiles,
  onTermsExtracted,
  isLoading,
  setIsLoading,
  onFilesChange
}: DocumentTextExtractorProps) => {
  const [extractedText, setExtractedText] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [processedFiles, setProcessedFiles] = useState<number>(0);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const [mammothLoaded, setMammothLoaded] = useState(false);
  const { toast } = useToast();

  // Check if PDF.js and Mammoth are loaded
  useEffect(() => {
    // Check if PDF.js is loaded
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      console.log("PDF.js is already loaded");
      setPdfJsLoaded(true);
    } else {
      console.log("PDF.js not detected, will load on demand");
    }

    // Check if Mammoth.js is loaded
    if (typeof window !== 'undefined' && window.mammoth) {
      console.log("Mammoth is already loaded");
      setMammothLoaded(true);
    } else {
      console.log("Mammoth not detected, will load on demand");
    }
  }, []);

  const ensureLibrariesLoaded = async () => {
    if (!pdfJsLoaded) {
      try {
        // Ensure PDF.js worker is available
        if (typeof window !== 'undefined' && !window.pdfjsLib) {
          console.log("Loading PDF.js dynamically");
          // The worker file should be available in the public directory
          window.pdfjsLib = await import('pdfjs-dist');
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker.js';
          console.log("PDF.js loaded successfully");
        }
        setPdfJsLoaded(true);
      } catch (error) {
        console.error("Error loading PDF.js:", error);
        toast({
          title: "PDF Processing Error",
          description: "Failed to load PDF processing library. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    }

    if (!mammothLoaded) {
      try {
        if (typeof window !== 'undefined' && !window.mammoth) {
          console.log("Loading Mammoth dynamically");
          const mammothModule = await import('mammoth');
          window.mammoth = mammothModule.default || mammothModule;
          console.log("Mammoth loaded successfully");
        }
        setMammothLoaded(true);
      } catch (error) {
        console.error("Error loading Mammoth:", error);
        toast({
          title: "Word Processing Error",
          description: "Failed to load Word document processing library. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const processDocuments = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsLoading(true);
    setProgress(0);
    setProcessedFiles(0);
    
    try {
      // Ensure libraries are loaded before processing
      const librariesLoaded = await ensureLibrariesLoaded();
      if (!librariesLoaded) {
        setIsLoading(false);
        return;
      }

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
      
      // Extract potential terms
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

  return (
    <div className="space-y-4">
      <DocumentProcessingIndicator 
        isLoading={isLoading}
        progress={progress}
        processedFiles={processedFiles}
        totalFiles={documentFiles.length}
      />
      
      {!isLoading && (
        <FileUploader 
          files={documentFiles}
          onFileChange={(files) => {
            onFilesChange(files);
            if (files.length > 0) {
              processDocuments(files);
            }
          }}
          acceptedFileTypes=".pdf,.docx,.doc"
          multiple={true}
        />
      )}
      
      <ExtractedTextPreview extractedText={extractedText} />
    </div>
  );
};

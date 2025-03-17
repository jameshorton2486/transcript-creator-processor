
import { useEffect } from "react";
import { DocumentTextExtractor } from "./document/DocumentTextExtractor";

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
  
  useEffect(() => {
    if (documentFiles.length > 0) {
      const documentExtractor = document.querySelector('div[data-document-extractor]');
      if (documentExtractor) {
        // @ts-ignore
        documentExtractor.processDocuments(documentFiles);
      }
    } else if (documentFile) {
      const documentExtractor = document.querySelector('div[data-document-extractor]');
      if (documentExtractor) {
        // @ts-ignore
        documentExtractor.processDocuments([documentFile]);
      }
    }
  }, [documentFiles, documentFile]);

  return (
    <div data-document-extractor>
      <DocumentTextExtractor
        documentFile={documentFile}
        documentFiles={documentFiles}
        onTermsExtracted={onTermsExtracted}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        onFilesChange={onFilesChange}
      />
    </div>
  );
};

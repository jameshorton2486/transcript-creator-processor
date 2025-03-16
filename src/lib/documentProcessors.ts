
// Import required libraries
import * as pdfjs from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// Set up the libraries in the global scope for the TerminologyExtractor to use
declare global {
  interface Window {
    pdfjsLib: typeof pdfjs;
    mammoth: typeof mammoth;
  }
}

// Initialize document processing libraries
export const initDocumentProcessors = () => {
  try {
    // Configure PDF.js
    const pdfjsVersion = pdfjs.version;
    console.log(`PDF.js version ${pdfjsVersion} initialized`);
    
    // Set the PDF.js worker source
    const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    
    // Make libraries available globally
    window.pdfjsLib = pdfjs;
    window.mammoth = mammoth;
    
    console.log('Document processing libraries initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize document processing libraries:', error);
    return false;
  }
};

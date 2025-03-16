
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

// Initialize libraries
export const initDocumentProcessors = () => {
  // Configure PDF.js
  const pdfjsVersion = pdfjs.version;
  console.log(`PDF.js version ${pdfjsVersion} initialized`);
  
  // Set the PDF.js worker source
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker.js';
  
  // Make libraries available globally
  window.pdfjsLib = pdfjs;
  window.mammoth = mammoth;
  
  console.log('Document processing libraries initialized');
};

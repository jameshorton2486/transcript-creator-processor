
// Main Google Speech API integration entry point
import { transcribeAudio, testApiKey } from './transcriber';
import { processSingleFile, transcribeSingleFile } from './singleFileProcessor';
import { processBatchFile, transcribeBatchedAudio } from './batchProcessor';
import { 
  formatGoogleResponse, 
  combineTranscriptionResults,
  extractTranscriptText 
} from './formatters/responseFormatter';

// Export the main functions that external modules will use
export {
  transcribeAudio,
  testApiKey,
  extractTranscriptText,
  
  // Core processing functions
  processSingleFile,
  transcribeSingleFile,
  processBatchFile,
  transcribeBatchedAudio,
  
  // Utility functions for response handling
  formatGoogleResponse,
  combineTranscriptionResults
};

// Note: We're not re-exporting arrayBufferToBase64 from responseFormatter
// since it's already exported from audio/index.ts

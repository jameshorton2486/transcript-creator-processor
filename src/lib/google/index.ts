
// Main Google Speech API integration entry point
import { transcribeAudio, testApiKey } from './transcriber';
import { processSingleFile, transcribeSingleFile } from './singleFileProcessor';
import { processBatchFile, transcribeBatchedAudio } from './batchProcessor';
import { 
  formatGoogleResponse, 
  combineTranscriptionResults,
  extractTranscriptText 
} from './formatters/responseFormatter';
import {
  applyLegalFormatting,
  formatQuestionAnswer,
  formatParagraphLayout
} from './formatters/legalFormatter';
import {
  normalizeSpeakerLabels,
  processSpeakerDiarization,
  formatSpeakerTurns
} from './formatters/speakerFormatter';
import {
  detectLegalContext
} from './formatters/transcriptExtractor';

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
  combineTranscriptionResults,
  
  // Legal formatting utilities
  applyLegalFormatting,
  formatQuestionAnswer,
  formatParagraphLayout,
  
  // Speaker formatting utilities
  normalizeSpeakerLabels,
  processSpeakerDiarization,
  formatSpeakerTurns,
  
  // Legal context detection
  detectLegalContext
};

// Main Google Speech API integration entry point
import { transcribeAudio, testApiKey } from './transcriber';
import { transcribeSingleFile } from './singleFileProcessor';
import { transcribeBatchedAudio } from './batchProcessor';
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
  
  // Core processing functions - now all audio will be processed in batches
  transcribeBatchedAudio,
  
  // Keep single file processor for internal use (used by batch processor)
  transcribeSingleFile,
  
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


// Transcriber module index
import { transcribeAudio } from './core';
import { testApiKey } from '../apiTester';
import { extractTranscriptText } from '../formatters/responseFormatter';

// Export the main functions that external modules will use
export { transcribeAudio, testApiKey, extractTranscriptText };

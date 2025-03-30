
/**
 * Main exports for Deepgram transcription module
 *
 * This module serves as a direct integration point for Deepgram,
 * offering functionality equivalent to AssemblyAI with the following mapping:
 *
 * | AssemblyAI    | Deepgram       |
 * |---------------|----------------|
 * | speakerLabels | diarize        |
 * | formatText    | smart_format   |
 * | punctuate     | punctuate      |
 * | models:       | models:        |
 * | - nova2       | - nova-2       |
 * | - enhanced    | - enhanced     |
 * | - standard    | - base         |
 *
 * This setup is designed as a seamless drop-in replacement for AssemblyAI integrations.
 */

// Export core functionality for file-based transcription only (not URL)
export { formatTranscriptionResult } from './formatter';
export { transcribeAudioFile } from './transcriber';
export {
  testApiKey,
  retrieveStoredApiKey,
  storeApiKey,
  clearApiKey,
} from './auth';

// Export new auth service functions
// We don't re-export clearApiKey to avoid naming conflicts 
export {
  validateApiKey,
  mockValidateApiKey,
  getSavedApiKey,
  saveApiKey,
} from './authService';

// Export new service modules
export * from './deepgramConfig';
export * from './deepgramService';

/**
 * Helper function to map AssemblyAI model names to Deepgram equivalents
 */
export function mapModelName(assemblyModel?: string): string {
  const modelMap: Record<string, string> = {
    standard: 'base',
    enhanced: 'enhanced',
    nova2: 'nova-2',
    default: 'nova-2',
  };

  return modelMap[assemblyModel || ''] || 'nova-2';
}

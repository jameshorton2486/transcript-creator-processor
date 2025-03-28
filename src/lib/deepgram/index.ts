
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

// Export core functionality
export { formatTranscriptionResult } from './formatter';
export {
  transcribeAudioFile,
  // Don't re-export testApiKey from transcriber as it would conflict with auth
} from './transcriber';
export {
  testApiKey,
  retrieveStoredApiKey,
  storeApiKey,
  clearApiKey,
} from './auth';

/**
 * Helper functions for model name mapping between different services
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


/**
 * Main exports for Deepgram transcription module
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


/**
 * Deepgram API helper functions
 */
import { DeepgramTranscriptionOptions } from "../../hooks/useDeepgramTranscription/types";

/**
 * Maps model names from legacy naming conventions to Deepgram naming
 */
export function mapModelName(legacyModel?: string): string {
  const modelMap: Record<string, string> = {
    standard: 'base',
    enhanced: 'enhanced',
    nova2: 'nova-2',
    default: 'nova-2',
    // Add other model mappings as needed
  };

  return modelMap[legacyModel?.toLowerCase() || ''] || 'nova-2';
}

/**
 * Transforms legacy options format to Deepgram API options format
 */
export function transformTranscriptionOptions(
  legacyOptions: Record<string, any> = {}
): DeepgramTranscriptionOptions {
  return {
    language: legacyOptions.language || 'en-US',
    diarize: legacyOptions.speakerLabels ?? legacyOptions.diarize,
    punctuate: legacyOptions.punctuate ?? true,
    smart_format: legacyOptions.formatText ?? legacyOptions.smart_format,
    model: mapModelName(legacyOptions.model),
    onProgress: legacyOptions.onProgress,
    abortSignal: legacyOptions.abortSignal,
    numSpeakers: legacyOptions.numSpeakers,
  };
}

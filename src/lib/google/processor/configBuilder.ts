
import { TranscriptionConfig, TranscriptionOptions } from './types';

/**
 * Builds the configuration object for the Google Speech-to-Text API request
 */
export const buildRequestConfig = (options: TranscriptionOptions): TranscriptionConfig => {
  const {
    encoding,
    languageCode = 'en-US',
    enableAutomaticPunctuation = true,
    model = 'latest_long',
    useEnhanced = true,
    enableSpeakerDiarization = false,
    minSpeakerCount = 2,
    maxSpeakerCount = 8,
    enableWordTimeOffsets = false,
    enableWordConfidence = false,
    customTerms = [],
  } = options;

  // Create the configuration object
  const config: TranscriptionConfig = {
    encoding,
    languageCode,
    enableAutomaticPunctuation,
    model,
    useEnhanced,
  };
  
  // IMPORTANT: NEVER add sampleRateHertz parameter now
  // Let Google API detect it from the file header to avoid mismatches
  
  // Add diarization if enabled
  if (enableSpeakerDiarization) {
    config.diarizationConfig = {
      enableSpeakerDiarization,
      minSpeakerCount,
      maxSpeakerCount,
    };
  }
  
  // Add word time offsets if enabled
  if (enableWordTimeOffsets) {
    config.enableWordTimeOffsets = enableWordTimeOffsets;
  }
  
  if (enableWordConfidence) {
    config.enableWordConfidence = enableWordConfidence;
  }
  
  // Add speech contexts with custom phrases if any
  if (customTerms && customTerms.length > 0) {
    config.speechContexts = [
      {
        phrases: customTerms,
        boost: 10,
      },
    ];
  }
  
  return config;
};

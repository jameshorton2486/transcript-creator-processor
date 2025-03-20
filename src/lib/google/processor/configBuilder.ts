
import { TranscriptionConfig, TranscriptionOptions } from './types';

/**
 * Builds the configuration object for the Google Speech-to-Text API request
 */
export const buildRequestConfig = (options: TranscriptionOptions): TranscriptionConfig => {
  const {
    encoding,
    languageCode = 'en-US',
    enableAutomaticPunctuation = true,
    model = 'video', // Changed from 'latest_long' to 'video', which is better for general transcription
    useEnhanced = true,
    enableSpeakerDiarization = false,
    minSpeakerCount = 2,
    maxSpeakerCount = 8,
    enableWordTimeOffsets = false,
    enableWordConfidence = false,
    customTerms = [],
  } = options;

  // Create the configuration object with required encoding property
  // Default to LINEAR16 if not provided
  const config: TranscriptionConfig = {
    encoding: encoding || 'LINEAR16', // Set a default value to satisfy the TypeScript requirement
    languageCode,
    enableAutomaticPunctuation,
    model,
    useEnhanced,
  };
  
  // For LINEAR16 (WAV), don't set sampleRateHertz to let Google detect it from the header
  // Only set sampleRateHertz for other encodings or if explicitly provided in options
  if (encoding !== 'LINEAR16' && options.sampleRateHertz) {
    config.sampleRateHertz = options.sampleRateHertz;
  }
  
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
        boost: 15, // Increased from 10 to 15 for better recognition
      },
    ];
  }
  
  return config;
};


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

  // Create the configuration object
  const config: TranscriptionConfig = {
    languageCode,
    enableAutomaticPunctuation,
    model,
    useEnhanced,
  };
  
  // Only set encoding if it's not LINEAR16 (WAV), as Google prefers to detect from header
  if (encoding !== 'LINEAR16') {
    config.encoding = encoding;
  }
  
  // Explicitly set sampleRateHertz for LINEAR16 (WAV) files to avoid detection issues
  if (encoding === 'LINEAR16') {
    config.sampleRateHertz = 16000; // Standard rate for speech recognition
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

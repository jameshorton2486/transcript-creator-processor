
import { SpeechConfig } from '../../speechConfig';
import { TranscriptionRequest } from '../types';

/**
 * Prepares a request object for the Google Speech-to-Text API.
 * 
 * @param audioBuffer - The audio buffer to be transcribed
 * @param apiKey - The Google API key
 * @param config - Optional speech configuration parameters
 * @returns A TranscriptionRequest object ready to be sent to the API
 */
export const prepareRequest = (
  audioBuffer: Uint8Array,
  apiKey: string,
  config?: SpeechConfig
): TranscriptionRequest => {
  // Default configuration if none provided
  const defaultConfig: SpeechConfig = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
    model: 'latest_long',
    enableAutomaticPunctuation: true,
    enableWordTimeOffsets: true,
    enableSpeakerDiarization: true,
    diarizationSpeakerCount: 2,
    maxAlternatives: 1,
  };

  // Merge default with provided config
  const mergedConfig = {
    ...defaultConfig,
    ...(config || {}),
  };

  console.log('Preparing Speech-to-Text request with config:', JSON.stringify(mergedConfig, null, 2));

  // Always ensure diarization settings are properly configured when enabled
  if (mergedConfig.enableSpeakerDiarization) {
    console.log('Speaker diarization is enabled, configuring with speaker count:', mergedConfig.diarizationSpeakerCount || 2);
    
    // Remove the old property that Google doesn't use directly
    const { diarizationSpeakerCount, ...configWithoutDiarizationCount } = mergedConfig;
    
    // Create the properly structured config with the diarizationConfig object
    const configWithDiarization = {
      ...configWithoutDiarizationCount,
      diarizationConfig: {
        enableSpeakerDiarization: true,
        minSpeakerCount: 1,
        maxSpeakerCount: diarizationSpeakerCount || 2
      }
    };
    
    // Construct the request object with diarization
    return {
      audio: {
        content: Buffer.from(audioBuffer).toString('base64'),
      },
      config: configWithDiarization,
      apiKey,
    };
  }

  // Construct the request object without diarization
  return {
    audio: {
      content: Buffer.from(audioBuffer).toString('base64'),
    },
    config: mergedConfig,
    apiKey,
  };
};

/**
 * Alias for prepareRequest to maintain compatibility with existing code
 */
export const prepareTranscriptionRequest = prepareRequest;

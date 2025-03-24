
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

  // Construct the request object
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

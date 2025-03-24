
import { TranscriptionOptions } from './types';
import { handleApiError } from './request/errorHandler';
import { prepareRequest } from './request/prepareRequest';
import { executeTranscriptionRequest } from './request/executeRequest';

/**
 * Sends a transcription request to the Google Speech-to-Text API
 * @param {string} apiKey - The Google Cloud API key
 * @param {string} audioContent - Base64 encoded audio content
 * @param {object} options - Transcription options
 * @returns {Promise<object>} - The transcription response
 */
export const sendTranscriptionRequest = async (
  apiKey: string, 
  audioContent: string, 
  options: TranscriptionOptions,
  actualEncoding?: string
) => {
  // Generate a request ID for logging
  const requestId = Math.random().toString(36).substring(2, 15);
  console.info(`[API:${requestId}] [${new Date().toISOString()}] Sending request to Google Speech API...`);
  
  try {
    // Convert base64 audio content to Uint8Array
    const audioBuffer = Buffer.from(audioContent, 'base64');
    
    // Prepare the speech config with proper diarization settings
    const speechConfig = {
      encoding: actualEncoding || options.encoding || 'LINEAR16',
      languageCode: options.languageCode || 'en-US',
      enableAutomaticPunctuation: options.enableAutomaticPunctuation || true,
      model: options.model || 'latest_long',
      enableSpeakerDiarization: true, // Always enable speaker diarization
      enableWordTimeOffsets: true, // Required for speaker diarization
      diarizationSpeakerCount: options.maxSpeakerCount || 2
    };
    
    console.log(`[API:${requestId}] Using diarization with ${speechConfig.diarizationSpeakerCount} speakers`);
    
    // Prepare the request
    const request = prepareRequest(audioBuffer, apiKey, speechConfig);
    
    // Set the API endpoint
    const apiEndpoint = 'speech:recognize';
    
    // Execute the request
    return await executeTranscriptionRequest(apiKey, requestId, apiEndpoint, request);
  } catch (error: any) {
    // Enhanced error logging with detailed context
    console.error(`[API:${requestId}] [${new Date().toISOString()}] Google API error occurred:`, error.message);
    
    // Get a detailed error with user-friendly message
    throw handleApiError(error, requestId);
  }
};

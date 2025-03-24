
import { TranscriptionOptions } from './types';
import { handleApiError } from './request/errorHandler';
import { prepareTranscriptionRequest } from './request/prepareRequest';
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
    // Prepare and validate the request
    const { requestData, apiEndpoint } = prepareTranscriptionRequest(
      apiKey, 
      audioContent, 
      options, 
      actualEncoding,
      requestId
    );
    
    // Execute the request
    return await executeTranscriptionRequest(apiKey, requestId, apiEndpoint, requestData);
  } catch (error: any) {
    // Enhanced error logging with detailed context
    console.error(`[API:${requestId}] [${new Date().toISOString()}] Google API error occurred:`, error.message);
    
    // Get a detailed error with user-friendly message
    throw handleApiError(error, requestId);
  }
};

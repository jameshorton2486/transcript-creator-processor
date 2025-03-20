
import axios from 'axios';
import { TranscriptionOptions } from './types';
import { validateApiRequest, validateEncoding, getDetailedErrorMessage } from './requestValidator';
import { buildRequestConfig } from './configBuilder';
import { pollOperationStatus } from './operationPoller';

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
  options: TranscriptionOptions
) => {
  // Generate a request ID for logging
  const requestId = Math.random().toString(36).substring(2, 15);
  console.info(`[API:${requestId}] [${new Date().toISOString()}] Sending request to Google Speech API...`);
  
  try {
    // Validate inputs
    validateApiRequest(apiKey, audioContent);
    validateEncoding(options.encoding);
    
    // Verify audio content seems valid
    if (audioContent.length < 1000) {
      console.warn(`[API:${requestId}] Audio content is suspiciously small (${audioContent.length} chars)`);
      throw new Error('Audio content appears to be too small or empty. Please check your audio file.');
    }
    
    // Build the configuration object
    const config = buildRequestConfig(options);
    
    // Log custom terms
    const customTerms = options.customTerms || [];
    if (customTerms.length > 0) {
      console.info(`[API:${requestId}] Added ${customTerms.length} custom terms with boost 15`);
    }
    
    // Log payload size for debugging
    const payloadSizeMB = (audioContent.length * 0.75 / 1024 / 1024).toFixed(2); // Convert base64 length to bytes, then to MB
    
    console.info(`[API:${requestId}] [${new Date().toISOString()}] Request config:`, {
      encoding: options.encoding,
      sampleRateHertz: config.sampleRateHertz || 'Omitted (using file header value)',
      languageCode: options.languageCode || 'en-US',
      model: config.model,
      useEnhanced: options.useEnhanced || true,
      enableSpeakerDiarization: options.enableSpeakerDiarization || false,
      hasCustomTerms: customTerms.length > 0,
      payloadSizeMB
    });
    
    // Prepare the request data
    const requestData = {
      config,
      audio: {
        content: audioContent,
      },
    };
    
    // ALWAYS use longrunningrecognize now for better reliability
    const apiEndpoint = 'speech:longrunningrecognize';
    
    console.log(`[API:${requestId}] Using API endpoint: ${apiEndpoint} for ${payloadSizeMB}MB payload`);
    
    return await executeTranscriptionRequest(apiKey, requestId, apiEndpoint, requestData);
  } catch (error: any) {
    // Enhanced error logging with detailed context
    console.error(`[API:${requestId}] [${new Date().toISOString()}] Google API error occurred:`, error.message);
    
    if (error.response) {
      // Log detailed error response
      console.error(`[API:${requestId}] [${new Date().toISOString()}] Google API error response:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Provide more specific guidance for common errors
      if (error.response.data?.error?.message?.includes('audio quality')) {
        console.error(`[API:${requestId}] Poor audio quality detected. Providing detailed troubleshooting.`);
        throw new Error('Google API reports poor audio quality. Try: 1) Converting audio to 16-bit WAV mono, 2) Ensuring clear speech with minimal background noise, 3) Using a smaller audio segment for testing.');
      }
    }
    
    // Get a detailed error message
    const errorMessage = getDetailedErrorMessage(error);
    throw new Error(errorMessage);
  }
};

/**
 * Executes the actual API request with proper error handling and timeout management
 */
async function executeTranscriptionRequest(apiKey: string, requestId: string, apiEndpoint: string, requestData: any) {
  try {
    // Create an AbortController for the main request
    const controller = new AbortController();
    
    // Set a longer timeout for the main request
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 300000); // 5-minute timeout
    
    // Send the request with longrunningrecognize
    const response = await axios.post(
      `https://speech.googleapis.com/v1/${apiEndpoint}?key=${apiKey}`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 300000, // 5-minute timeout for large files
        signal: controller.signal
      }
    );
    
    // Clear the timeout as the request completed
    clearTimeout(timeoutId);
    
    // Check if this is a long-running operation
    if (response.data.name && !response.data.results) {
      console.log(`[API:${requestId}] Long-running operation started with name: ${response.data.name}`);
      
      // Poll for results with operation-specific abort controller
      const operationResult = await pollOperationStatus(apiKey, response.data.name, requestId);
      console.log(`[API:${requestId}] Long-running operation completed`);
      return operationResult;
    }
    
    // Log success
    console.log(`[API:${requestId}] [${new Date().toISOString()}] Received successful response from Google Speech API`);
    
    // Check if response has results
    if (!response.data || !response.data.results) {
      console.warn(`[API:${requestId}] [${new Date().toISOString()}] Warning: Empty results returned from Google API`);
      throw new Error('No transcription results were returned. The audio may not contain recognizable speech or may have quality issues.');
    } else {
      console.log(`[API:${requestId}] [${new Date().toISOString()}] Transcription successful with ${response.data.results.length} result segments`);
    }
    
    // Return the response data
    return response.data;
  } catch (axiosError: any) {
    // Enhanced error handling for specific API errors
    if (axiosError.response && axiosError.response.data && axiosError.response.data.error) {
      const googleError = axiosError.response.data.error;
      
      // Check for specific Google API errors
      if (googleError.message && googleError.message.includes("exceeds duration limit")) {
        console.error(`[API:${requestId}] Google API duration limit error: ${googleError.message}`);
        throw new Error(`Google API error: ${googleError.message}`);
      }
      
      // Handle poor audio quality errors with more specific guidance
      if (googleError.message && googleError.message.includes("audio quality")) {
        console.error(`[API:${requestId}] Poor audio quality error: ${googleError.message}`);
        throw new Error('Audio quality issue detected. Try: 1) Converting to 16kHz mono WAV, 2) Reducing background noise, 3) Ensuring clear speech in the recording.');
      }
      
      // Log detailed error info
      console.error(`[API:${requestId}] Google API error:`, googleError);
      throw new Error(`Google API error: ${googleError.message}`);
    }
    
    // Check if the request was aborted
    if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
      throw new Error('Request to Google API timed out. Try processing a smaller audio segment.');
    }
    
    // Re-throw with more details
    throw axiosError;
  }
}

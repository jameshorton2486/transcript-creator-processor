
import axios from 'axios';
import { pollOperationStatus } from '../operationPoller';
import { handleApiError } from './errorHandler';

/**
 * Executes the actual API request with proper error handling and timeout management
 */
export async function executeTranscriptionRequest(
  apiKey: string, 
  requestId: string, 
  apiEndpoint: string, 
  requestData: any
) {
  try {
    // Create an AbortController for the main request
    const controller = new AbortController();
    
    // Set a longer timeout for the main request
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 300000); // 5-minute timeout
    
    // Send the request
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
        throw new Error(`Google API error: Audio exceeds maximum duration limit. The file will be automatically split into smaller chunks on retry.`);
      }
      
      // Special handling for encoding errors
      if (googleError.message && (
          googleError.message.includes("Encoding in RecognitionConfig must") ||
          googleError.message.includes("sample_rate_hertz")
      )) {
        console.error(`[API:${requestId}] Encoding/sample rate mismatch error: ${googleError.message}`);
        throw new Error('Audio format issue detected. The application will automatically retry with auto-detection of format parameters.');
      }
      
      // Handle poor audio quality errors with more specific guidance
      if (googleError.message && googleError.message.includes("audio quality")) {
        console.error(`[API:${requestId}] Poor audio quality error: ${googleError.message}`);
        throw new Error('Audio quality issue detected. Try: 1) Converting to mono WAV, 2) Reducing background noise, 3) Ensuring clear speech in the recording.');
      }
      
      // Log detailed error info
      console.error(`[API:${requestId}] Google API error:`, googleError);
      throw new Error(`Google API error: ${googleError.message}`);
    }
    
    // Check if the request was aborted
    if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
      throw new Error('Request to Google API timed out. The system will automatically retry with smaller audio segments.');
    }
    
    // Re-throw with more details
    throw axiosError;
  }
}

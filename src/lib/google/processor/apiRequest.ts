import axios from 'axios';
import { TranscriptionConfig, TranscriptionOptions } from './types';
import { validateApiRequest, validateEncoding, getDetailedErrorMessage } from './requestValidator';

/**
 * Builds the configuration object for the Google Speech-to-Text API request
 */
const buildRequestConfig = (options: TranscriptionOptions): TranscriptionConfig => {
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
    
    // Build the configuration object
    const config = buildRequestConfig(options);
    
    // Log custom terms
    const customTerms = options.customTerms || [];
    if (customTerms.length > 0) {
      console.info(`[API:${requestId}] Added ${customTerms.length} custom terms with boost 10`);
    }
    
    // Log payload size for debugging
    const payloadSizeMB = (audioContent.length * 0.75 / 1024 / 1024).toFixed(2); // Convert base64 length to bytes, then to MB
    
    console.info(`[API:${requestId}] [${new Date().toISOString()}] Request config:`, {
      encoding: options.encoding,
      sampleRateHertz: 'Omitted (using file header value)',
      languageCode: options.languageCode || 'en-US',
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
    }
    
    // Get a detailed error message
    const errorMessage = getDetailedErrorMessage(error);
    throw new Error(errorMessage);
  }
};

/**
 * Improved polling mechanism for long-running operations with better cancellation support
 * @param {string} apiKey - Google API key
 * @param {string} operationName - The operation name to poll
 * @param {string} requestId - Request ID for logging
 * @returns {Promise<any>} The operation result
 */
const pollOperationStatus = async (apiKey: string, operationName: string, requestId: string): Promise<any> => {
  let attempts = 0;
  const maxAttempts = 60; // Allow up to 60 attempts (10 minutes with exponential backoff)
  const baseDelay = 5000; // Start with 5-second delay
  
  // Create a controller to help with cancellations
  const controller = new AbortController();
  const signal = controller.signal;
  
  // Add event listeners to cancel polling when user navigates away
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      controller.abort();
    }
  };
  
  const handleBeforeUnload = () => {
    controller.abort();
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  try {
    while (attempts < maxAttempts) {
      // Check if polling has been cancelled
      if (signal.aborted) {
        console.log(`[API:${requestId}] Polling cancelled due to page navigation`);
        throw new Error('Operation cancelled due to page navigation');
      }
      
      attempts++;
      
      try {
        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(1.5, attempts - 1), 60000); // Cap at 60 seconds
        
        // Log polling attempt
        console.log(`[API:${requestId}] Polling operation ${operationName}, attempt ${attempts}/${maxAttempts}, waiting ${delay/1000}s`);
        
        // Wait before polling
        await new Promise(resolve => {
          const timeoutId = setTimeout(resolve, delay);
          
          // If aborted during timeout, clear the timeout
          signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            resolve(null);
          }, { once: true });
        });
        
        // Check if polling has been cancelled during wait
        if (signal.aborted) {
          console.log(`[API:${requestId}] Polling cancelled during wait`);
          throw new Error('Operation cancelled due to page navigation');
        }
        
        // Check operation status with timeout
        const pollingController = new AbortController();
        const pollingSignal = pollingController.signal;
        
        // Set timeout for this specific polling request
        const timeoutId = setTimeout(() => pollingController.abort(), 30000);
        
        // Check operation status
        const response = await axios.get(
          `https://speech.googleapis.com/v1/operations/${operationName}?key=${apiKey}`,
          {
            headers: {
              'Accept': 'application/json',
            },
            timeout: 30000, // 30-second timeout for polling requests
            signal: pollingSignal
          }
        );
        
        // Clear timeout as request completed
        clearTimeout(timeoutId);
        
        // If operation is done, return the result
        if (response.data.done) {
          console.log(`[API:${requestId}] Operation completed in ${attempts} polling attempts`);
          
          // Check for errors
          if (response.data.error) {
            throw new Error(`Operation failed: ${response.data.error.message}`);
          }
          
          // Return the response result
          return response.data.response;
        }
        
        // Log progress if available
        if (response.data.metadata && response.data.metadata.progressPercent) {
          console.log(`[API:${requestId}] Operation progress: ${response.data.metadata.progressPercent}%`);
        }
      } catch (error: any) {
        // Check if polling has been cancelled
        if (signal.aborted || (error.name === 'AbortError')) {
          console.log(`[API:${requestId}] Polling request aborted`);
          throw new Error('Operation cancelled due to page navigation or timeout');
        }
        
        console.error(`[API:${requestId}] Error polling operation:`, error.message);
        
        // If we've reached max attempts, throw error
        if (attempts >= maxAttempts) {
          throw new Error(`Operation polling timed out after ${maxAttempts} attempts: ${error.message}`);
        }
        
        // Otherwise continue polling
        console.log(`[API:${requestId}] Continuing to poll despite error...`);
      }
    }
    
    throw new Error(`Operation did not complete within the allowed time (${maxAttempts} polling attempts)`);
  } finally {
    // Clean up event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }
};

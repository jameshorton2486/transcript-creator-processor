
import axios from 'axios';
import { TranscriptionConfig, TranscriptionOptions } from './types';
import { validateApiRequest, validateEncoding, getDetailedErrorMessage } from './requestValidator';

/**
 * Builds the configuration object for the Google Speech-to-Text API request
 */
const buildRequestConfig = (options: TranscriptionOptions): TranscriptionConfig => {
  const {
    encoding,
    sampleRateHertz = 16000, // Always default to 16000 Hz
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
    sampleRateHertz,
    languageCode,
    enableAutomaticPunctuation,
    model,
    useEnhanced,
  };
  
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
      sampleRateHertz: options.sampleRateHertz || 16000,
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
    
    console.log(`[API:${requestId}] [${new Date().toISOString()}] Sending request to Google Speech API`);
    
    // Send the request
    const response = await axios.post(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 120000, // 2-minute timeout for large files
      }
    );
    
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

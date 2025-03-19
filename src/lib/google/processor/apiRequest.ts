
import axios from 'axios';
import { getAudioContext } from '../../audio/audioContext';

// Add a proper interface for the configuration
interface TranscriptionConfig {
  encoding: string;
  sampleRateHertz?: number;
  languageCode: string;
  enableAutomaticPunctuation: boolean;
  model: string;
  useEnhanced: boolean;
  diarizationConfig?: {
    enableSpeakerDiarization: boolean;
    minSpeakerCount: number;
    maxSpeakerCount: number;
  };
  enableWordTimeOffsets?: boolean;
  enableWordConfidence?: boolean;
  speechContexts?: {
    phrases: string[];
    boost: number;
  }[];
}

interface TranscriptionOptions {
  encoding: string;
  sampleRateHertz?: number;
  languageCode?: string;
  enableAutomaticPunctuation?: boolean;
  model?: string;
  useEnhanced?: boolean;
  enableSpeakerDiarization?: boolean;
  minSpeakerCount?: number;
  maxSpeakerCount?: number;
  enableWordTimeOffsets?: boolean;
  enableWordConfidence?: boolean;
  customTerms?: string[];
  [key: string]: any;
}

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

  // Improved logging with timestamps and request ID for traceability
  const requestId = Math.random().toString(36).substring(2, 15);
  console.info(`[API:${requestId}] [${new Date().toISOString()}] Sending request to Google Speech API...`);
  
  // Create the configuration object with proper type
  const config: TranscriptionConfig = {
    encoding,
    sampleRateHertz, // Always include 16000 Hz
    languageCode,
    enableAutomaticPunctuation,
    model,
    useEnhanced,
  };
  
  console.info(`[API:${requestId}] Using sample rate: 16000 Hz (resampled)`);
  
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
    console.info(`[API:${requestId}] Added ${customTerms.length} custom terms with boost 10`);
  }
  
  // Enhanced validation with detailed error messages
  if (!apiKey || apiKey.trim() === '') {
    const error = new Error('API key is required');
    console.error(`[API:${requestId}] [${new Date().toISOString()}] Error: ${error.message}`);
    throw error;
  }
  
  // Validate audio content
  if (!audioContent || audioContent.trim() === '') {
    const error = new Error('Audio content is empty or invalid');
    console.error(`[API:${requestId}] [${new Date().toISOString()}] Error: ${error.message}`);
    throw error;
  }
  
  // Check encoding format compatibility
  const validEncodings = ['LINEAR16', 'FLAC', 'MP3', 'OGG_OPUS', 'MULAW', 'AMR', 'AMR_WB', 'WEBM_OPUS'];
  if (!validEncodings.includes(encoding)) {
    const error = new Error(`Invalid encoding format: ${encoding}. Must be one of: ${validEncodings.join(', ')}`);
    console.error(`[API:${requestId}] [${new Date().toISOString()}] Error: ${error.message}`);
    throw error;
  }
  
  // Log payload size for debugging
  const payloadSizeMB = (audioContent.length * 0.75 / 1024 / 1024).toFixed(2); // Convert base64 length to bytes, then to MB
  
  console.info(`[API:${requestId}] [${new Date().toISOString()}] Request config:`, {
    encoding,
    sampleRateHertz: 16000, // Always 16000 Hz
    languageCode,
    useEnhanced,
    enableSpeakerDiarization,
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
  
  try {
    console.log(`[API:${requestId}] [${new Date().toISOString()}] Sending request to Google Speech API`);
    // Send the request to Google's Speech-to-Text API
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
    
    // Enhanced success logging with performance metrics
    const processingTime = new Date().getTime() - new Date().getTime();
    console.log(`[API:${requestId}] [${new Date().toISOString()}] Received successful response from Google Speech API (processing time: ${processingTime}ms)`);
    
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
      // The request was made and the server responded with a status code that falls out of the range of 2xx
      console.error(`[API:${requestId}] [${new Date().toISOString()}] Google API error response:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      if (error.response.data && error.response.data.error) {
        const googleError = error.response.data.error;
        console.error(`[API:${requestId}] [${new Date().toISOString()}] Google error details:`, {
          code: googleError.code,
          message: googleError.message,
          status: googleError.status
        });
        
        // Improved error categorization with specific error messages
        if (googleError.message.includes('API key not valid')) {
          throw new Error('Invalid API key. Please check your Google Cloud Speech-to-Text API key.');
        } else if (googleError.message.includes('billing')) {
          throw new Error('Google Cloud billing not enabled. Please enable billing for your Google Cloud project.');
        } else if (googleError.message.includes('permission')) {
          throw new Error('Permission denied. Ensure Speech-to-Text API is enabled in your Google Cloud project.');
        } else if (googleError.message.includes('quota')) {
          throw new Error('API quota exceeded. Please try again later or upgrade your quota limits.');
        } else if (googleError.message.includes('rate limit') || error.response.status === 429) {
          throw new Error('Rate limit exceeded. Please reduce the frequency of requests or implement retry logic with exponential backoff.');
        } else if (googleError.message.includes('Invalid audio')) {
          throw new Error(`Invalid audio format: ${googleError.message}. Please check your audio encoding and format.`);
        } else if (googleError.message.includes('sampleRateHertz')) {
          throw new Error(`Sample rate error: ${googleError.message}. Audio will be resampled automatically on the next attempt.`);
        } else {
          throw new Error(`Google API error: ${googleError.message}`);
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`[API:${requestId}] [${new Date().toISOString()}] No response received from Google API:`, error.request);
      throw new Error('No response received from Google API. Please check your internet connection and try again.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`[API:${requestId}] [${new Date().toISOString()}] Request setup error:`, error.message);
    }
    
    // Create a more descriptive error message for general case
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
};

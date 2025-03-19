
import axios from 'axios';

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
    sampleRateHertz,
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

  // Log request parameters for debugging
  console.info('[API] Sending request to Google Speech API...');
  
  // Create the configuration object with proper type
  const config: TranscriptionConfig = {
    encoding,
    languageCode,
    enableAutomaticPunctuation,
    model,
    useEnhanced,
  };
  
  // Only add sampleRateHertz if specified - this allows Google to auto-detect from WAV headers
  if (sampleRateHertz) {
    config.sampleRateHertz = sampleRateHertz;
  } else {
    console.info('[API] Sample rate not specified, letting Google detect from audio header');
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
        boost: 10,
      },
    ];
  }
  
  // Validate audio content
  if (!audioContent || audioContent.trim() === '') {
    console.error('[API ERROR] Audio content is empty');
    throw new Error('Audio content is empty or invalid');
  }
  
  // Log payload size for debugging
  const payloadSizeMB = (audioContent.length * 0.75 / 1024 / 1024).toFixed(2); // Convert base64 length to bytes, then to MB
  
  console.info('[API] Request config:', {
    encoding,
    sampleRateHertz: sampleRateHertz || 'auto-detect',
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
    console.log('[API] Sending request to Google Speech API');
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
    
    // Log successful response for debugging
    console.log('[API] Received successful response from Google Speech API');
    
    // Return the response data
    return response.data;
  } catch (error: any) {
    // Log detailed error information
    console.error('[API ERROR] Google API error occurred:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code that falls out of the range of 2xx
      console.error('[API ERROR] Google API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      if (error.response.data && error.response.data.error) {
        const googleError = error.response.data.error;
        console.error('[API ERROR] Google error details:', {
          code: googleError.code,
          message: googleError.message,
          status: googleError.status
        });
        
        // Provide more specific error messages based on common Google API errors
        if (googleError.message.includes('API key not valid')) {
          throw new Error('Invalid API key. Please check your Google Cloud Speech-to-Text API key.');
        } else if (googleError.message.includes('billing')) {
          throw new Error('Google Cloud billing not enabled. Please enable billing for your Google Cloud project.');
        } else if (googleError.message.includes('permission')) {
          throw new Error('Permission denied. Ensure Speech-to-Text API is enabled in your Google Cloud project.');
        } else if (googleError.message.includes('quota')) {
          throw new Error('API quota exceeded. Please try again later.');
        } else {
          throw new Error(`Google API error: ${googleError.message}`);
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[API ERROR] No response received from Google API:', error.request);
      throw new Error('No response received from Google API. Please check your internet connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[API ERROR] Request setup error:', error.message);
    }
    
    // Create a more descriptive error message for general case
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
};

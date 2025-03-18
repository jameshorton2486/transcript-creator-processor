
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

/**
 * Sends a transcription request to the Google Speech-to-Text API
 * @param {string} apiKey - The Google Cloud API key
 * @param {string} audioContent - Base64 encoded audio content
 * @param {object} options - Transcription options
 * @returns {Promise<object>} - The transcription response
 */
export const sendTranscriptionRequest = async (apiKey, audioContent, options) => {
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
    // Send the request to Google's Speech-to-Text API
    const response = await axios.post(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      requestData
    );
    
    // Return the response data
    return response.data;
  } catch (error) {
    // Log detailed error information
    if (error.response && error.response.data) {
      console.error('[API ERROR] Google API error response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('[API ERROR] Network or request error:', error.message);
    }
    
    // Create a more descriptive error
    const errorMessage = error.response && error.response.data
      ? `Invalid request to Google API: ${error.response.data.error.message}`
      : `API request failed: ${error.message}`;
    
    throw new Error(errorMessage);
  }
};

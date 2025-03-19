
import { TranscriptionOptions } from './types';

/**
 * Validates the API key and audio content
 */
export const validateApiRequest = (apiKey: string, audioContent: string): void => {
  // Enhanced validation with detailed error messages
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key is required');
  }
  
  // Validate audio content
  if (!audioContent || audioContent.trim() === '') {
    throw new Error('Audio content is empty or invalid');
  }
};

/**
 * Validates the encoding format
 */
export const validateEncoding = (encoding: string): void => {
  // Check encoding format compatibility
  const validEncodings = ['LINEAR16', 'FLAC', 'MP3', 'OGG_OPUS', 'MULAW', 'AMR', 'AMR_WB', 'WEBM_OPUS'];
  if (!validEncodings.includes(encoding)) {
    throw new Error(`Invalid encoding format: ${encoding}. Must be one of: ${validEncodings.join(', ')}`);
  }
};

/**
 * Categorizes and returns a more specific error message based on Google API errors
 */
export const getDetailedErrorMessage = (error: any): string => {
  // Only process if we have a Google API error response
  if (error.response?.data?.error) {
    const googleError = error.response.data.error;
    
    if (googleError.message.includes('API key not valid')) {
      return 'Invalid API key. Please check your Google Cloud Speech-to-Text API key.';
    } else if (googleError.message.includes('billing')) {
      return 'Google Cloud billing not enabled. Please enable billing for your Google Cloud project.';
    } else if (googleError.message.includes('permission')) {
      return 'Permission denied. Ensure Speech-to-Text API is enabled in your Google Cloud project.';
    } else if (googleError.message.includes('quota')) {
      return 'API quota exceeded. Please try again later or upgrade your quota limits.';
    } else if (googleError.message.includes('rate limit') || error.response.status === 429) {
      return 'Rate limit exceeded. Please reduce the frequency of requests or implement retry logic with exponential backoff.';
    } else if (googleError.message.includes('Invalid audio')) {
      return `Invalid audio format: ${googleError.message}. Please check your audio encoding and format.`;
    } else if (googleError.message.includes('sampleRateHertz')) {
      return `Sample rate error: ${googleError.message}. Audio will be resampled automatically on the next attempt.`;
    }
    
    return `Google API error: ${googleError.message}`;
  }
  
  // Handle network errors or missing response
  if (error.request && !error.response) {
    return 'No response received from Google API. Please check your internet connection and try again.';
  }
  
  // Generic error
  return `Failed to transcribe audio: ${error.message}`;
};

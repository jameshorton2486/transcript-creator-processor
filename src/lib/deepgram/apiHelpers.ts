
import { TranscriptionResult, DeepgramAPIResponse } from './types';

/**
 * Validates a Deepgram API key
 * 
 * @param apiKey The API key to validate
 * @returns Promise that resolves to an object with valid status
 */
export const validateApiKey = async (apiKey: string): Promise<{ valid: boolean; message?: string }> => {
  if (!apiKey) return { valid: false, message: 'API key is required' };
  
  try {
    // Simple validation logic
    if (apiKey.length < 32) {
      return { valid: false, message: 'API key appears to be too short' };
    }
    
    // For proper validation, you'd make a request to the Deepgram API
    // This is a placeholder that should be replaced with actual validation
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      message: error instanceof Error ? error.message : 'Unknown error validating API key'
    };
  }
};

/**
 * Transcribes an audio file using Deepgram
 * 
 * @param file The audio file to transcribe
 * @param apiKey The Deepgram API key
 * @param options Transcription options
 * @returns Promise that resolves to the Deepgram API response
 */
export const transcribeFile = async (
  file: File, 
  apiKey: string, 
  options: any = {}
): Promise<DeepgramAPIResponse> => {
  if (!file || !apiKey) {
    throw new Error('File and API key are required');
  }
  
  // This is a placeholder that should be replaced with actual transcription logic
  console.log('Transcribing file:', file.name, 'with options:', options);
  
  // Return a mock response for now
  return {
    results: {
      channels: [{
        alternatives: [{
          transcript: 'This is a placeholder transcript. Replace with actual Deepgram API call.',
          confidence: 0.95
        }]
      }]
    }
  };
};

/**
 * Extracts a usable TranscriptionResult from the Deepgram API response
 * 
 * @param response The Deepgram API response
 * @returns A simplified TranscriptionResult
 */
export const extractTranscriptionResult = (response: DeepgramAPIResponse): TranscriptionResult => {
  if (!response.results?.channels?.[0]?.alternatives?.[0]) {
    return { transcript: '', confidence: 0 };
  }
  
  const alternative = response.results.channels[0].alternatives[0];
  
  return {
    transcript: alternative.transcript || '',
    confidence: alternative.confidence || 0,
    words: alternative.words || [],
    metadata: response.metadata || {}
  };
};

/**
 * Helper for storing and retrieving API keys
 */
export const apiKeyStorage = {
  save: (key: string): void => {
    localStorage.setItem('deepgram_api_key', key);
  },
  
  get: (): string => {
    return localStorage.getItem('deepgram_api_key') || '';
  },
  
  clear: (): void => {
    localStorage.removeItem('deepgram_api_key');
  }
};

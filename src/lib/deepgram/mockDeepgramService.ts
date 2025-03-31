
/**
 * Mock service for Deepgram API
 * Provides development fallbacks when the API isn't available
 */

import { DeepgramAPIResponse, DeepgramRequestOptions } from './types';

/**
 * Check if we should use mock responses
 */
export const shouldUseMockResponses = (): boolean => {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;
  
  // Check if we're in a test environment
  const isTest = import.meta.env.MODE === 'test';
  
  // Check for environment variables that might indicate mock mode
  const hasMockFlag = import.meta.env.VITE_USE_MOCK_API === 'true';
  
  return isDevelopment || isTest || hasMockFlag;
};

/**
 * Helper function to safely use the Deepgram API or fall back to mocks
 * This provides a consistent interface whether we're using real API or mocks
 */
export const safeApiCall = async <T>(
  apiFunction: () => Promise<T>,
  mockFunction: () => Promise<T>
): Promise<T> => {
  if (shouldUseMockResponses()) {
    console.log('Using mock response for Deepgram API call');
    return mockFunction();
  }
  
  try {
    return await apiFunction();
  } catch (error) {
    console.warn('API call failed, falling back to mock response', error);
    return mockFunction();
  }
};

/**
 * Mock validation for API key
 */
export const mockValidateApiKey = (apiKey: string): Promise<{ valid: boolean; message?: string }> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Very basic validation - just checks if key is provided and has reasonable length
      if (!apiKey || apiKey.trim() === '') {
        resolve({ 
          valid: false, 
          message: 'API key is required' 
        });
      } else if (apiKey.length < 10) {
        resolve({ 
          valid: false, 
          message: 'API key appears to be too short. Deepgram API keys are typically longer.' 
        });
      } else {
        // Accept any reasonable looking key for development
        resolve({ valid: true });
      }
    }, 800); // Simulate network latency
  });
};

/**
 * Mock transcription response
 */
export const mockTranscribeFile = async (
  file: File,
  options: DeepgramRequestOptions
): Promise<DeepgramAPIResponse> => {
  return new Promise((resolve) => {
    // Simulate processing time based on file size
    const processingTime = Math.min(2000, file.size / 1024);
    
    setTimeout(() => {
      // Generate mock transcript with file name included
      const mockTranscript = `This is a mock transcription for file "${file.name}" with ${options.diarize ? 'speaker diarization' : 'no speaker diarization'} and ${options.model} model. The actual transcription would contain the speech from your audio file.`;
      
      // Create words with timestamps
      const words = mockTranscript.split(' ').map((word, index) => {
        const start = index * 0.3;
        const end = start + 0.25;
        return {
          word,
          start,
          end,
          confidence: 0.8 + Math.random() * 0.19,
          punctuated_word: word,
          speaker: options.diarize ? (index % 3) : undefined
        };
      });
      
      // Create mock utterances if diarization is enabled
      const utterances = options.diarize ? [
        {
          start: 0.01,
          end: 5.2,
          confidence: 0.92,
          channel: 0,
          transcript: mockTranscript.substring(0, Math.floor(mockTranscript.length / 2)),
          speaker: 0,
          words: words.slice(0, Math.floor(words.length / 2))
        },
        {
          start: 5.3,
          end: 10.5,
          confidence: 0.88,
          channel: 0,
          transcript: mockTranscript.substring(Math.floor(mockTranscript.length / 2)),
          speaker: 1,
          words: words.slice(Math.floor(words.length / 2))
        }
      ] : undefined;
      
      // Return a mock transcription result
      resolve({
        results: {
          channels: [{
            alternatives: [{
              transcript: mockTranscript,
              confidence: 0.92,
              words
            }],
            detected_language: options.language || 'en'
          }],
          utterances
        },
        metadata: {
          request_id: "mock-request-" + Date.now(),
          transaction_key: "mock-transaction",
          sha256: "mock-sha",
          created: new Date().toISOString(),
          duration: 30.5,
          channels: 1,
          models: [options.model || "mock-model"]
        }
      });
    }, processingTime);
  });
};

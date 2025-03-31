
/**
 * Service for interacting with Deepgram API through server-side proxies
 */

import { 
  DeepgramRequestOptions, 
  DeepgramWord, 
  DeepgramParagraph, 
  DeepgramUtterance, 
  DeepgramAPIResponse, 
  TranscriptionResult,
  TranscriptionJobStatus,
  FormattedTranscript
} from './types';
import { DEFAULT_OPTIONS, PROXY_SERVER_URL, PROXY_ENDPOINTS, createQueryParams, SUPPORTED_MIME_TYPES, SUPPORTED_EXTENSIONS } from './deepgramConfig';
import { mockValidateApiKey, mockTranscribeFile, safeApiCall } from './mockDeepgramService';
import { formatTranscriptionResult } from './formatter';

// Re-export types
export type { 
  DeepgramRequestOptions,
  DeepgramWord,
  DeepgramParagraph,
  DeepgramUtterance,
  DeepgramAPIResponse,
  TranscriptionResult
};

/**
 * Try to use the proxy server, fallback to direct API if necessary
 * @param endpoint Proxy endpoint path
 * @param options Fetch options
 */
const fetchWithProxyFallback = async (endpoint: string, options: RequestInit): Promise<Response> => {
  try {
    // Try the proxy server first
    const proxyUrl = `${PROXY_SERVER_URL}${endpoint}`;
    console.log(`Attempting to connect to proxy server: ${proxyUrl}`);
    
    const response = await fetch(proxyUrl, {
      ...options,
      // Increase timeout for proxy requests
      signal: options.signal || (AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined)
    });
    
    if (!response.ok) {
      throw new Error(`Proxy server returned status ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.warn(`Proxy server unavailable, falling back to direct API call: ${error}`);
    
    // Fallback to direct API call (may encounter CORS issues)
    if (endpoint.includes('validate-key')) {
      return fetch('/api/auth/validate-key', options);
    } else if (endpoint.includes('transcribe')) {
      return fetch('/api/transcription/upload', options);
    }
    
    throw new Error(`No fallback available for endpoint: ${endpoint}`);
  }
};

/**
 * Validate a Deepgram API key
 */
export const validateApiKey = async (apiKey: string): Promise<{ valid: boolean; message?: string }> => {
  return safeApiCall(
    // Real API call
    async () => {
      if (!apiKey || apiKey.trim() === '') {
        return { 
          valid: false, 
          message: 'API key is required' 
        } as const;
      }

      const response = await fetchWithProxyFallback(
        PROXY_ENDPOINTS.validateKey,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey }),
        }
      );

      const data = await response.json();

      if (!(data.valid || data.isValid)) {
        return { 
          valid: false, 
          message: data.error || data.message || 'Invalid API key' 
        } as const;
      }

      return { valid: true } as const;
    },
    // Mock response
    () => mockValidateApiKey(apiKey)
  );
};

/**
 * Validate if a file is supported by Deepgram
 * @param file File to validate
 * @returns Object with validation result and error message if any
 */
export const validateAudioFile = (file: File): { valid: boolean; message?: string } => {
  if (!file) {
    return { 
      valid: false, 
      message: 'No file provided' 
    };
  }

  // Check file size - Deepgram limit is 250MB
  if (file.size > 250 * 1024 * 1024) {
    return { 
      valid: false, 
      message: `File size exceeds Deepgram's 250MB limit. Please choose a smaller file.` 
    };
  }

  // Check file type by MIME type
  if (SUPPORTED_MIME_TYPES.includes(file.type)) {
    return { valid: true };
  }
  
  // If MIME type check fails, try file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (fileExtension && SUPPORTED_EXTENSIONS.includes(fileExtension)) {
    return { valid: true };
  }

  return { 
    valid: false, 
    message: `File type not supported. Supported formats include: ${SUPPORTED_EXTENSIONS.join(', ')}` 
  };
};

/**
 * Transcribe an audio or video file using Deepgram API
 */
export const transcribeFile = async (
  file: File, 
  apiKey: string,
  options: DeepgramRequestOptions = DEFAULT_OPTIONS
): Promise<DeepgramAPIResponse> => {
  return safeApiCall(
    // Real API call
    async () => {
      // Validate file first
      const fileValidation = validateAudioFile(file);
      if (!fileValidation.valid) {
        throw new Error(fileValidation.message);
      }

      // Create form data with file and options
      const formData = new FormData();
      formData.append('file', file);
      formData.append('apiKey', apiKey);
      
      // Add all options to the form data
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // Send request to server-side proxy with fallback
      try {
        const response = await fetchWithProxyFallback(
          PROXY_ENDPOINTS.transcribe,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { error: 'Failed to parse error response' };
          }

          // Handle specific Deepgram error codes
          if (errorData.err_code === "Bad Request" && errorData.err_msg?.includes("corrupt or unsupported data")) {
            throw new Error(`Audio file format not supported or corrupt: ${errorData.err_msg}`);
          } else if (errorData.err_code === "INVALID_AUTH") {
            throw new Error(`Authentication failed: Invalid API key`);
          } else if (errorData.err_code === "INSUFFICIENT_PERMISSIONS") {
            throw new Error(`Insufficient permissions: Your API key does not have access to this feature`);
          }

          throw new Error(errorData.error || errorData.err_msg || `Failed to transcribe file (Status: ${response.status})`);
        }

        return await response.json();
      } catch (error) {
        if (error instanceof Error) {
          // Re-throw if it's our custom error with proper message
          throw error;
        }
        throw new Error(`Failed to transcribe file: ${error}`);
      }
    },
    // Mock response
    () => mockTranscribeFile(file, options)
  );
};

/**
 * Extract the main transcription result from the Deepgram response
 */
export const extractTranscriptionResult = (response: DeepgramAPIResponse): TranscriptionResult => {
  // Default values if structure is unexpected
  const defaultResult: TranscriptionResult = {
    transcript: '',
    confidence: 0,
    words: []
  };

  if (!response.results?.channels?.length) {
    return defaultResult;
  }

  const channel = response.results.channels[0];
  const alternative = channel.alternatives[0];

  if (!alternative) {
    return defaultResult;
  }

  // Get the formatted result with speaker segments if available
  const { formattedResult } = formatTranscriptionResult(response);

  return {
    transcript: alternative.transcript,
    confidence: alternative.confidence,
    words: alternative.words,
    text: alternative.transcript,
    formattedResult,
    rawResponse: response,
    paragraphs: alternative.paragraphs?.paragraphs,
    utterances: response.results.utterances,
    language: channel.detected_language
  };
};

/**
 * Local storage utilities for API key management
 */
export const apiKeyStorage = {
  save: (apiKey: string): void => {
    try {
      localStorage.setItem('deepgram_api_key', apiKey);
    } catch (error) {
      console.error('Error saving API key to localStorage:', error);
    }
  },
  
  get: (): string | null => {
    try {
      return localStorage.getItem('deepgram_api_key');
    } catch (error) {
      console.error('Error reading API key from localStorage:', error);
      return null;
    }
  },
  
  clear: (): void => {
    try {
      localStorage.removeItem('deepgram_api_key');
    } catch (error) {
      console.error('Error clearing API key from localStorage:', error);
    }
  }
};

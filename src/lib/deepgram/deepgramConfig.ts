
/**
 * Configuration for Deepgram API integration
 */

import { DeepgramRequestOptions } from './types';

// Base URL for the proxy server
export const PROXY_SERVER_URL = 'http://localhost:4000';

// Endpoints for the proxy server
export const PROXY_ENDPOINTS = {
  validateKey: '/validate-key',
  transcribe: '/transcribe',
  checkStatus: '/check-status'
};

/**
 * Default options for Deepgram transcription requests
 */
export const DEFAULT_OPTIONS: DeepgramRequestOptions = {
  language: 'en',
  model: 'nova',
  punctuate: true,
  smart_format: true,
  diarize: false
};

/**
 * Create query parameters string from options
 */
export const createQueryParams = (options: DeepgramRequestOptions): string => {
  const params = new URLSearchParams();
  
  Object.entries(options).forEach(([key, value]) => {
    // Handle boolean values
    if (typeof value === 'boolean') {
      params.append(key, value ? 'true' : 'false');
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      value.forEach(item => params.append(key, item));
    }
    // Handle other values
    else if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
};

/**
 * Supported audio/video file MIME types for Deepgram
 */
export const SUPPORTED_MIME_TYPES = [
  // Audio types
  'audio/wav', 'audio/x-wav',
  'audio/mp3', 'audio/mpeg',
  'audio/flac',
  'audio/m4a', 'audio/x-m4a',
  'audio/aac', 
  'audio/ogg', 'audio/opus',
  'audio/webm',
  // Video types
  'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'
];

/**
 * Supported file extensions for Deepgram
 */
export const SUPPORTED_EXTENSIONS = [
  'mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus',
  'mp4', 'mov', 'webm', 'avi'
];

/**
 * Maximum file size (250MB - Deepgram's limit)
 */
export const MAX_FILE_SIZE = 250 * 1024 * 1024;

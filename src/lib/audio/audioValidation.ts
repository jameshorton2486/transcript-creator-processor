
/**
 * Audio file validation utilities for transcription services
 */

export type ValidationResult = {
  valid: boolean;
  reason?: string;
};

// Define valid mime types and extensions for better maintainability
const VALID_MIME_TYPES = [
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

const VALID_EXTENSIONS = [
  'mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus',
  'mp4', 'mov', 'webm', 'avi'
];

// Default size limit for most transcription services (250MB)
const DEFAULT_MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB

/**
 * Validates if an audio file meets requirements for transcription
 * 
 * @param file - The file to validate
 * @param maxSize - Optional custom max file size in bytes (defaults to 250MB)
 * @returns ValidationResult with valid status and reason if invalid
 */
export const validateAudioFile = (
  file: File, 
  maxSize: number = DEFAULT_MAX_FILE_SIZE
): ValidationResult => {
  // Check if file exists
  if (!file) {
    return { valid: false, reason: 'No file provided' };
  }

  // Check file size
  if (file.size > maxSize) {
    return { 
      valid: false, 
      reason: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit` 
    };
  }

  // Some browsers/systems might not properly set the MIME type
  // so we check both MIME type and file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  
  const isValidMimeType = VALID_MIME_TYPES.includes(file.type);
  const isValidExtension = VALID_EXTENSIONS.includes(fileExtension);
  
  if (!isValidMimeType && !isValidExtension) {
    return { 
      valid: false, 
      reason: `File type "${file.type || fileExtension || 'unknown'}" is not supported. Please use MP3, WAV, M4A, FLAC, OGG, AAC, MP4, MOV, etc.` 
    };
  }

  // Check for empty files
  if (file.size === 0) {
    return {
      valid: false,
      reason: 'File is empty and cannot be processed'
    };
  }

  return { valid: true };
};

/**
 * Formats bytes into human-readable format with appropriate unit
 * 
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with appropriate unit (KB, MB, GB)
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * Alias for validateAudioFile for backward compatibility
 */
export const isValidAudioFile = validateAudioFile;

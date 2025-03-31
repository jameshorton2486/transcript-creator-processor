
/**
 * Validates if an audio file is suitable for Deepgram processing
 * 
 * @param file - File to validate
 * @returns Object with valid status and optional message
 */

// Import from config where the constants are defined
import { SUPPORTED_MIME_TYPES, SUPPORTED_EXTENSIONS, MAX_FILE_SIZE } from './deepgramConfig';

export const validateAudioFile = (file: File): { readonly valid: false; readonly message: any; } | { readonly valid: true; readonly message?: undefined; } => {
  if (!file) {
    return { valid: false, message: 'No file selected.' };
  }

  const maxFileSize = MAX_FILE_SIZE;
  if (file.size > maxFileSize) {
    return {
      valid: false,
      message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 250MB limit.`
    };
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  const isValidMimeType = SUPPORTED_MIME_TYPES.includes(file.type);
  const isValidExtension = SUPPORTED_EXTENSIONS.includes(fileExtension);

  if (!isValidMimeType && !isValidExtension) {
    return {
      valid: false,
      message: `File format not supported. Please use a supported format: ${SUPPORTED_EXTENSIONS.join(', ')}.`
    };
  }

  return { valid: true };
};

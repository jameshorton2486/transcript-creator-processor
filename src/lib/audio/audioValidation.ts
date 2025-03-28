
/**
 * Audio file validation utilities for AssemblyAI API
 */

/**
 * Validates if an audio file meets requirements for transcription
 */
export const validateAudioFile = (file: File): { valid: boolean; reason?: string } => {
  // Check file size
  if (!file) {
    return { valid: false, reason: 'No file provided' };
  }

  // Check file size (100MB limit is reasonable for most use cases)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      reason: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 100MB limit` 
    };
  }

  // Check file type - updated to match explicitly supported formats
  const validTypes = [
    'audio/wav', 'audio/x-wav',
    'audio/mp3', 'audio/mpeg',
    'audio/flac',
    'audio/m4a', 'audio/x-m4a',
    'video/mp4', 'video/quicktime'
  ];
  
  if (!validTypes.includes(file.type) && 
      !file.name.match(/\.(wav|mp3|flac|m4a|mp4)$/i)) {
    return { 
      valid: false, 
      reason: `File type "${file.type || 'unknown'}" is not supported` 
    };
  }

  return { valid: true };
};

/**
 * Alias for validateAudioFile for backward compatibility
 */
export const isValidAudioFile = validateAudioFile;

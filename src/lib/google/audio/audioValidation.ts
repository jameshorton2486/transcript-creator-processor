
/**
 * Audio file validation utilities for Google Speech API
 */

/**
 * Validates if an audio file meets requirements for transcription
 */
export const validateAudioFile = (file: File): { valid: boolean; reason?: string } => {
  // Check file size
  if (!file) {
    return { valid: false, reason: 'No file provided' };
  }

  // Check file size (100MB limit for Google Speech API)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      reason: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 100MB limit` 
    };
  }

  // Check file type
  const validTypes = [
    'audio/wav', 'audio/x-wav',
    'audio/mp3', 'audio/mpeg',
    'audio/flac',
    'audio/ogg',
    'audio/m4a', 'audio/x-m4a',
    'audio/webm'
  ];
  
  if (!validTypes.includes(file.type) && 
      !file.name.match(/\.(wav|mp3|flac|ogg|m4a|webm)$/i)) {
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

/**
 * Detects audio encoding based on file type
 */
export const detectAudioEncoding = (file: File): string => {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (fileName.endsWith('.flac') || mimeType.includes('flac')) {
    return 'FLAC';
  } else if (fileName.endsWith('.mp3') || mimeType.includes('mp3') || mimeType.includes('mpeg')) {
    return 'MP3';
  } else if (fileName.endsWith('.wav') || mimeType.includes('wav')) {
    return 'LINEAR16';
  } else if (fileName.endsWith('.ogg') || mimeType.includes('ogg')) {
    return 'OGG_OPUS';
  } else if (fileName.endsWith('.webm') || mimeType.includes('webm')) {
    return 'WEBM_OPUS';
  } else {
    return 'ENCODING_UNSPECIFIED';
  }
};

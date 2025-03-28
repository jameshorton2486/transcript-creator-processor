
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

  // Check file size (250MB limit for AssemblyAI)
  const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      reason: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 250MB limit` 
    };
  }

  // Check file type - support more media formats
  const validTypes = [
    'audio/wav', 'audio/x-wav',
    'audio/mp3', 'audio/mpeg',
    'audio/flac',
    'audio/m4a', 'audio/x-m4a',
    'audio/aac', 'audio/ogg',
    'video/mp4', 'video/quicktime', 'video/webm'
  ];
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  const validExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'mp4', 'mov', 'webm'];
  
  if (!validTypes.includes(file.type) && 
      !validExtensions.includes(fileExtension)) {
    return { 
      valid: false, 
      reason: `File type "${file.type || 'unknown'}" is not supported. Please use MP3, MP4, WAV, M4A, FLAC, OGG, AAC, etc.` 
    };
  }

  return { valid: true };
};

/**
 * Alias for validateAudioFile for backward compatibility
 */
export const isValidAudioFile = validateAudioFile;

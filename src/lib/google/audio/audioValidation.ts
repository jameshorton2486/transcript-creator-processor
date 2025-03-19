
/**
 * Validates audio file types
 */

/**
 * Checks if a file is a supported audio type
 */
export const isValidAudioFile = (file: File): boolean => {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  
  // Check MIME type
  const isValidMimeType = type.includes('audio') || 
                          type.includes('video') ||
                          type === 'application/octet-stream'; // Some audio files might have this generic type
  
  // Check file extension
  const isValidExtension = name.endsWith('.wav') || 
                           name.endsWith('.mp3') || 
                           name.endsWith('.flac') || 
                           name.endsWith('.ogg') || 
                           name.endsWith('.m4a') || 
                           name.endsWith('.amr') || 
                           name.endsWith('.webm');
  
  const isValid = isValidMimeType || isValidExtension;
  
  if (!isValid) {
    console.warn(`[VALIDATION] Invalid audio file: ${name} (${type})`);
  } else {
    console.log(`[VALIDATION] Valid audio file: ${name} (${type})`);
  }
  
  return isValid;
};

/**
 * Detects the audio encoding format based on file type
 */
export const detectAudioEncoding = (file: File): { encoding: string } => {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  
  // Log file details for debugging
  console.log(`[ENCODING] Detecting encoding for file: ${name} (${type || 'unknown type'})`);
  
  let encoding = 'LINEAR16'; // Default encoding
  
  if (type.includes('flac') || name.endsWith('.flac')) {
    encoding = 'FLAC';
  } else if (type.includes('mp3') || name.endsWith('.mp3')) {
    encoding = 'MP3';
  } else if (type.includes('wav') || name.endsWith('.wav')) {
    encoding = 'LINEAR16';
  } else if (type.includes('ogg') || name.endsWith('.ogg')) {
    encoding = 'OGG_OPUS';
  } else if (type.includes('amr') || name.endsWith('.amr')) {
    encoding = 'AMR';
  } else if (type.includes('webm') || name.endsWith('.webm')) {
    encoding = 'WEBM_OPUS';
  }
  
  console.log(`[ENCODING] Selected encoding: ${encoding} for file: ${name}`);
  return { encoding };
};

/**
 * Provides a fallback encoding if the original detection fails
 * Always falls back to LINEAR16 (WAV) as it's most widely supported
 */
export const getFallbackEncoding = (): { encoding: string } => {
  console.log(`[ENCODING] Using fallback LINEAR16 encoding`);
  return { encoding: 'LINEAR16' };
};

/**
 * Attempts to get audio MIME type from file extension
 */
export const getMimeTypeFromExtension = (fileName: string): string => {
  const name = fileName.toLowerCase();
  
  if (name.endsWith('.wav')) {
    return 'audio/wav';
  } else if (name.endsWith('.mp3')) {
    return 'audio/mpeg';
  } else if (name.endsWith('.flac')) {
    return 'audio/flac';
  } else if (name.endsWith('.ogg')) {
    return 'audio/ogg';
  } else if (name.endsWith('.m4a')) {
    return 'audio/mp4';
  } else if (name.endsWith('.amr')) {
    return 'audio/amr';
  } else if (name.endsWith('.webm')) {
    return 'audio/webm';
  }
  
  return 'audio/mpeg'; // Default to MP3
};


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
  
  return isValidMimeType || isValidExtension;
};

/**
 * Detects the audio encoding format based on file type
 */
export const detectAudioEncoding = (file: File): { encoding: string } => {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  
  if (type.includes('flac') || name.endsWith('.flac')) {
    return { encoding: 'FLAC' };
  } else if (type.includes('mp3') || name.endsWith('.mp3')) {
    return { encoding: 'MP3' };
  } else if (type.includes('wav') || name.endsWith('.wav')) {
    return { encoding: 'LINEAR16' };
  } else if (type.includes('ogg') || name.endsWith('.ogg')) {
    return { encoding: 'OGG_OPUS' };
  } else if (type.includes('amr') || name.endsWith('.amr')) {
    return { encoding: 'AMR' };
  } else if (type.includes('webm') || name.endsWith('.webm')) {
    return { encoding: 'WEBM_OPUS' };
  }
  
  // Default to LINEAR16 (WAV) format if unknown
  return { encoding: 'LINEAR16' };
};

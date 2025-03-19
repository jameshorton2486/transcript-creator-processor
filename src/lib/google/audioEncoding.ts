
/**
 * Detects audio encoding based on file type
 * @param {File} file - The audio file to analyze
 * @returns {object} - The encoding information
 */
export const detectAudioEncoding = (file: File) => {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  // Log file info for better debugging
  console.log(`[ENCODING] Detecting encoding for file: ${fileName} (${fileType || 'unknown mime type'})`);
  
  let encoding = 'LINEAR16'; // Default encoding for WAV files
  
  if (fileType.includes('mp3') || fileName.endsWith('.mp3')) {
    encoding = 'MP3';
  } else if (fileType.includes('flac') || fileName.endsWith('.flac')) {
    encoding = 'FLAC';
  } else if (fileType.includes('ogg') || fileName.endsWith('.ogg')) {
    encoding = 'OGG_OPUS';
  } else if (fileType.includes('amr') || fileName.endsWith('.amr')) {
    encoding = 'AMR';
  } else if (fileType.includes('webm') || fileName.endsWith('.webm')) {
    encoding = 'WEBM_OPUS';
  } else if (fileType.includes('wav') || fileName.endsWith('.wav')) {
    encoding = 'LINEAR16';
  } else if (fileType.includes('x-wav') || fileName.endsWith('.wav')) {
    encoding = 'LINEAR16';
  } else {
    console.warn(`[ENCODING] Unknown file type detected: ${fileType || fileName}. Defaulting to LINEAR16 encoding.`);
  }
  
  console.log(`[ENCODING] Selected encoding: ${encoding} for file type: ${fileType || fileName}`);
  return { encoding };
};

/**
 * Determines the standard sample rate based on file type
 * Note: We now always use 16000 Hz for Google Speech API regardless of original file
 */
export const getStandardSampleRate = (fileType: string) => {
  // Always return 16000 Hz for all file types to match API expectations
  console.log(`[SAMPLE RATE] Using standard 16000 Hz sample rate for all file types`);
  return 16000;
};

/**
 * Checks if the file is a valid audio file supported by Google Speech-to-Text API
 */
export const isValidAudioFile = (file: File): boolean => {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  // List of supported file types by Google Speech-to-Text
  const validTypes = [
    'audio/wav', 'audio/x-wav',
    'audio/mp3', 'audio/mpeg',
    'audio/flac',
    'audio/ogg', 'audio/ogg; codecs=opus',
    'audio/amr',
    'audio/webm',
    'video/mp4', 'video/webm', 'video/quicktime' // Also allow video formats
  ];
  
  // Check by MIME type first
  if (validTypes.some(type => fileType.includes(type.split('/')[1]))) {
    return true;
  }
  
  // If MIME type check fails, check by extension
  const validExtensions = ['.wav', '.mp3', '.flac', '.ogg', '.amr', '.webm', '.mp4', '.mov', '.m4a'];
  if (validExtensions.some(ext => fileName.endsWith(ext))) {
    return true;
  }
  
  console.warn(`[VALIDATION] Unsupported audio file: ${fileName} (${fileType})`);
  return false;
};

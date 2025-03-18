
/**
 * Detects audio encoding based on file type
 * @param {File} file - The audio file to analyze
 * @returns {object} - The encoding information
 */
export const detectAudioEncoding = (file: File) => {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
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
  }
  
  return { encoding };
};

/**
 * Determines the standard sample rate based on file type
 */
export const getStandardSampleRate = (fileType: string) => {
  if (fileType.includes('mp3')) {
    return 44100; // Standard for most MP3 files
  } else if (fileType.includes('flac')) {
    return 48000; // Common for FLAC files
  } else {
    return 16000; // Default for speech recognition
  }
};


/**
 * Attempts to detect sample rate from WAV header
 * @param {ArrayBuffer} buffer - The audio buffer
 * @returns {number|null} - The detected sample rate or null if can't be detected
 */
export const detectSampleRateFromWav = (buffer) => {
  try {
    // WAV header sample rate is at byte offset 24, as a 32-bit little-endian integer
    if (buffer.byteLength < 28) {
      console.warn('[FORMAT] Buffer too small to contain WAV header');
      return null;
    }
    
    // Create a DataView to read the header
    const dataView = new DataView(buffer);
    
    // Check if this is a valid RIFF WAV file
    const riff = String.fromCharCode(
      dataView.getUint8(0),
      dataView.getUint8(1),
      dataView.getUint8(2),
      dataView.getUint8(3)
    );
    
    const wave = String.fromCharCode(
      dataView.getUint8(8),
      dataView.getUint8(9),
      dataView.getUint8(10),
      dataView.getUint8(11)
    );
    
    if (riff !== 'RIFF' || wave !== 'WAVE') {
      console.warn('[FORMAT] Not a valid WAV file format');
      return null;
    }
    
    // Read sample rate (bytes 24-27)
    const sampleRate = dataView.getUint32(24, true); // true = little endian
    
    console.info(`[FORMAT] Detected sample rate from WAV header: ${sampleRate} Hz`);
    return sampleRate;
  } catch (error) {
    console.warn('[FORMAT] Error detecting sample rate from WAV:', error);
    return null;
  }
};

/**
 * Determines if we should use auto sample rate detection for the given file
 * @param {string} mimeType - The file mime type
 * @returns {boolean} - Whether to use auto detection
 */
export const shouldUseAutoSampleRate = (mimeType) => {
  // For WAV files, we can rely on the header information
  if (mimeType.includes('wav') || mimeType.includes('wave')) {
    return true;
  }
  
  // For other formats like MP3, FLAC, etc. we might need browser-based detection
  // but default to false to allow override through options
  return false;
};

/**
 * Gets the appropriate sample rate for the audio, using detection or fallback
 * @param {ArrayBuffer} buffer - The audio buffer
 * @param {string} mimeType - The file mime type
 * @param {number} defaultRate - Default rate to use if detection fails
 * @returns {number|undefined} - The sample rate to use, or undefined to let API auto-detect
 */
export const getSampleRate = (buffer, mimeType, defaultRate = 16000) => {
  if (shouldUseAutoSampleRate(mimeType)) {
    // For WAV files, try to read from header
    if (mimeType.includes('wav') || mimeType.includes('wave')) {
      const detectedRate = detectSampleRateFromWav(buffer);
      if (detectedRate) {
        return detectedRate;
      }
    }
    
    // If we failed to detect or it's another format, don't specify and let Google detect
    console.info('[FORMAT] Using auto sample rate detection');
    return undefined;
  }
  
  // For formats that don't support detection, use the default
  console.info(`[FORMAT] Using default sample rate: ${defaultRate} Hz`);
  return defaultRate;
};

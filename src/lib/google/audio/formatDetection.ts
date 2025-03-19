

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
    
    // Also read number of channels (bytes 22-23)
    const numChannels = dataView.getUint16(22, true);
    
    console.info(`[FORMAT] Detected from WAV header: ${sampleRate} Hz, ${numChannels} channels`);
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
  // No need to use auto detection anymore as we'll always resample to 16000 Hz
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
  // We always use 16000 Hz for Google Speech API now, regardless of detection
  console.info('[FORMAT] Using fixed sample rate: 16000 Hz for Google Speech API');
  return 16000;
};

/**
 * Detects number of channels from WAV header
 * @param {ArrayBuffer} buffer - The audio buffer
 * @returns {number|null} - The detected number of channels or null if can't be detected
 */
export const detectChannelsFromWav = (buffer) => {
  try {
    if (buffer.byteLength < 23) {
      console.warn('[FORMAT] Buffer too small to contain WAV header channel info');
      return null;
    }
    
    const dataView = new DataView(buffer);
    
    // Check if this is a valid RIFF WAV file
    const riff = String.fromCharCode(
      dataView.getUint8(0),
      dataView.getUint8(1),
      dataView.getUint8(2),
      dataView.getUint8(3)
    );
    
    if (riff !== 'RIFF') {
      console.warn('[FORMAT] Not a valid WAV file format (missing RIFF header)');
      return null;
    }
    
    // Read number of channels (bytes 22-23)
    const numChannels = dataView.getUint16(22, true); // true = little endian
    
    console.info(`[FORMAT] Detected ${numChannels} channels from WAV header`);
    return numChannels;
  } catch (error) {
    console.warn('[FORMAT] Error detecting channels from WAV:', error);
    return null;
  }
};

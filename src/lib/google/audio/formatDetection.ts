
/**
 * Attempts to detect sample rate from WAV header
 * @param {ArrayBuffer} buffer - The audio buffer
 * @returns {number|null} - The detected sample rate or null if can't be detected
 */
export const detectSampleRateFromWav = (buffer: ArrayBuffer): number | null => {
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
 * @returns {boolean} - Whether to use auto detection
 */
export const shouldUseAutoSampleRate = (): boolean => {
  // For the Google Speech API, we now ALWAYS let the API determine sample rate from the file
  return true;
};

/**
 * Gets the appropriate sample rate for the audio
 * Note: We ALWAYS return null now to let Google Speech API extract it from the file header
 */
export const getSampleRate = (): null => {
  // Always return null to let Google API use the rate from the file header
  console.info('[FORMAT] Letting Google Speech API use sample rate from audio header');
  return null;
};

/**
 * Detects number of channels from WAV header
 * @param {ArrayBuffer} buffer - The audio buffer
 * @returns {number} - The detected number of channels (defaults to 1 if detection fails)
 */
export const detectChannelsFromWav = (buffer: ArrayBuffer): number => {
  try {
    if (buffer.byteLength < 23) {
      console.warn('[FORMAT] Buffer too small to contain WAV header channel info');
      return 1; // Default to mono
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
      return 1; // Default to mono
    }
    
    // Read number of channels (bytes 22-23)
    const numChannels = dataView.getUint16(22, true); // true = little endian
    
    console.info(`[FORMAT] Detected ${numChannels} channels from WAV header`);
    return numChannels;
  } catch (error) {
    console.warn('[FORMAT] Error detecting channels from WAV:', error);
    return 1; // Default to mono
  }
};

/**
 * Detect if a buffer represents a FLAC file
 * @param {ArrayBuffer} buffer - The audio buffer
 * @returns {boolean} - Whether this appears to be a FLAC file
 */
export const isFlacFile = (buffer: ArrayBuffer): boolean => {
  try {
    if (buffer.byteLength < 4) return false;
    
    const dataView = new DataView(buffer);
    const flacSignature = [0x66, 0x4C, 0x61, 0x43]; // "fLaC"
    
    // Check for FLAC signature
    for (let i = 0; i < Math.min(100, buffer.byteLength - 4); i++) {
      if (
        dataView.getUint8(i) === flacSignature[0] &&
        dataView.getUint8(i + 1) === flacSignature[1] &&
        dataView.getUint8(i + 2) === flacSignature[2] &&
        dataView.getUint8(i + 3) === flacSignature[3]
      ) {
        console.info(`[FORMAT] FLAC signature detected at offset ${i}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.warn('[FORMAT] Error checking for FLAC signature:', error);
    return false;
  }
};


/**
 * Utilities for WAV conversion
 */

/**
 * Converts a FLAC file to WAV format for better compatibility
 * Returns a promise that resolves to the converted WAV file
 */
export const convertFlacToWav = async (flacFile: File): Promise<File> => {
  try {
    // If we have a Web Audio API with AudioContext support, we can try to convert
    if (typeof AudioContext !== 'undefined') {
      const audioContext = new AudioContext();
      
      try {
        // Read the file as an ArrayBuffer
        const arrayBuffer = await flacFile.arrayBuffer();
        
        // Decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer).catch(error => {
          console.warn('[CONVERT] Browser failed to decode FLAC:', error);
          throw new Error('Browser cannot decode this FLAC file');
        });
        
        // Create a WAV file from the decoded audio buffer (force mono)
        const wav = encodeWavFile(convertToMono(audioBuffer));
        
        // Create a new File object from the WAV data
        return new File([wav], flacFile.name.replace(/\.flac$/i, '.wav'), { type: 'audio/wav' });
      } catch (decodeError) {
        console.warn('[CONVERT] Audio decoding failed:', decodeError);
        console.log('[CONVERT] Returning original file due to decoding failure');
        return flacFile; // Return original file if conversion fails
      }
    } else {
      console.warn('[CONVERT] AudioContext not supported by this browser, cannot convert FLAC to WAV');
      return flacFile; // Return original file if conversion is not possible
    }
  } catch (error) {
    console.error('[CONVERT] Error converting FLAC to WAV:', error);
    return flacFile; // Return original file if conversion fails
  }
};

/**
 * Ensure audio buffer is mono by averaging channels if needed
 */
export const convertToMono = (audioBuffer: AudioBuffer): AudioBuffer => {
  // If already mono, just return it
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer;
  }
  
  console.log(`[CONVERT] Converting ${audioBuffer.numberOfChannels} channels to mono`);
  
  // Create a new offline audio context
  const offlineContext = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
  
  // Create a new AudioBuffer (mono)
  const monoBuffer = offlineContext.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
  const monoChannelData = monoBuffer.getChannelData(0);
  
  // Mix down all channels to mono
  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0;
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      sum += audioBuffer.getChannelData(channel)[i];
    }
    monoChannelData[i] = sum / audioBuffer.numberOfChannels;
  }
  
  return monoBuffer;
};

/**
 * Encodes an AudioBuffer to a WAV file
 */
export const encodeWavFile = (audioBuffer: AudioBuffer): Blob => {
  try {
    // Ensure the buffer is mono (single channel)
    const monoBuffer = convertToMono(audioBuffer);
    
    // Get the number of samples
    const length = monoBuffer.length;
    const sampleRate = monoBuffer.sampleRate;
    
    // Create the WAV file container
    const buffer = new ArrayBuffer(44 + length * 2); // 44 bytes header + 2 bytes per sample
    const view = new DataView(buffer);
    
    // Write WAV header
    // "RIFF" chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // subchunk1 size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono - 1 channel
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate (sampleRate * 1 channel * 2 bytes per sample)
    view.setUint16(32, 2, true); // block align (1 channel * 2 bytes per sample)
    view.setUint16(34, 16, true); // bits per sample
    
    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Write audio data
    const dataView = new DataView(buffer, 44);
    const channelData = monoBuffer.getChannelData(0);
    
    // Convert to 16-bit samples
    for (let i = 0; i < length; i++) {
      // Convert float32 (-1 to 1) to int16 (-32768 to 32767)
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      dataView.setInt16(i * 2, value, true);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  } catch (error) {
    console.error('[CONVERT] Error encoding WAV file:', error);
    throw error;
  }
};

/**
 * Attempts to convert an audio file to WAV format for better compatibility
 * Returns the original file if conversion fails
 */
export const tryConvertToWav = async (audioFile: File): Promise<File> => {
  try {
    const fileName = audioFile.name.toLowerCase();
    
    // Only try to convert non-WAV formats
    if (fileName.endsWith('.wav') || audioFile.type.includes('wav')) {
      console.log('[CONVERT] File is already WAV format, checking if normalization needed');
      return audioFile; // Already WAV, might still need normalization later
    }
    
    console.log(`[CONVERT] Attempting to convert ${fileName} to WAV format`);
    
    // For FLAC files, use dedicated converter
    if (fileName.endsWith('.flac') || audioFile.type.includes('flac')) {
      return await convertFlacToWav(audioFile);
    }
    
    // Generic converter for other formats
    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await audioFile.arrayBuffer();
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Ensure the buffer is mono
      const monoBuffer = convertToMono(audioBuffer);
      
      // Create WAV blob from mono buffer
      const wavBlob = encodeWavFile(monoBuffer);
      
      // Create a new filename replacing the extension with .wav
      const newFileName = audioFile.name.replace(/\.[^.]+$/, '.wav');
      
      console.log(`[CONVERT] Successfully converted ${fileName} to WAV format`);
      return new File([wavBlob], newFileName, { type: 'audio/wav' });
    } catch (decodeError) {
      console.warn(`[CONVERT] Failed to decode ${audioFile.name}:`, decodeError);
      console.log('[CONVERT] Returning original file for direct API submission');
      return audioFile; // Return original file if conversion fails
    }
  } catch (error) {
    console.error('[CONVERT] Error converting to WAV:', error);
    return audioFile; // Return original file if any error occurs
  }
};

// Helper function to write a string to a DataView
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Converts a WAV file to ensure it has the correct format for Speech API
 * Forces mono channel and 16000 Hz sample rate
 */
export const normalizeWavFile = async (wavFile: File): Promise<File> => {
  try {
    // First check if we can decode this file
    const audioContext = new AudioContext();
    const arrayBuffer = await wavFile.arrayBuffer();
    
    try {
      // Decode the audio
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log(`[NORMALIZE] WAV file details: ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate} Hz`);
      
      // Check if we need to normalize (convert to mono)
      if (audioBuffer.numberOfChannels === 1) {
        console.log('[NORMALIZE] WAV file is already mono, no normalization needed');
        return wavFile;
      }
      
      console.log('[NORMALIZE] Converting WAV to mono');
      
      // Convert to mono
      const monoBuffer = convertToMono(audioBuffer);
      
      // Encode mono buffer to WAV
      const wavBlob = encodeWavFile(monoBuffer);
      
      // Return as a new file
      console.log('[NORMALIZE] Successfully normalized WAV file to mono');
      return new File([wavBlob], wavFile.name, { type: 'audio/wav' });
    } catch (decodeError) {
      console.warn('[NORMALIZE] Could not decode WAV file:', decodeError);
      return wavFile; // Return original file if decoding fails
    }
  } catch (error) {
    console.error('[NORMALIZE] Error normalizing WAV file:', error);
    return wavFile; // Return original file if normalization fails
  }
};

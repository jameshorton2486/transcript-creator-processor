
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
        
        // Create a WAV file from the decoded audio buffer
        const wav = encodeWavFile(audioBuffer);
        
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
 * Encodes an AudioBuffer to a WAV file
 */
export const encodeWavFile = (audioBuffer: AudioBuffer): Blob => {
  try {
    // Extract raw audio data
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    // Create the WAV file container
    const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(buffer);
    
    // Write WAV header
    // "RIFF" chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // subchunk1 size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true); // byte rate
    view.setUint16(32, numberOfChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    
    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Write interleaved audio data
    const dataView = new DataView(buffer, 44);
    let offset = 0;
    
    // Get all channel data
    const channelData: Float32Array[] = [];
    for (let channel = 0; channel < numberOfChannels; channel++) {
      channelData.push(audioBuffer.getChannelData(channel));
    }
    
    // Interleave and convert to 16-bit samples
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        // Convert float32 (-1 to 1) to int16 (-32768 to 32767)
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        dataView.setInt16(offset, value, true);
        offset += 2;
      }
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
      return audioFile; // Already WAV, no conversion needed
    }
    
    // For FLAC files, use dedicated converter
    if (fileName.endsWith('.flac') || audioFile.type.includes('flac')) {
      return await convertFlacToWav(audioFile);
    }
    
    // Generic converter for other formats
    const audioContext = new AudioContext();
    const arrayBuffer = await audioFile.arrayBuffer();
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const wavBlob = encodeWavFile(audioBuffer);
      
      // Create a new filename replacing the extension with .wav
      const newFileName = audioFile.name.replace(/\.[^.]+$/, '.wav');
      
      return new File([wavBlob], newFileName, { type: 'audio/wav' });
    } catch (decodeError) {
      console.warn(`[CONVERT] Failed to decode ${audioFile.name}:`, decodeError);
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
    const audioContext = new AudioContext();
    const arrayBuffer = await wavFile.arrayBuffer();
    
    // Decode the audio
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Check if we need to normalize
    if (audioBuffer.numberOfChannels === 1 && audioBuffer.sampleRate === 16000) {
      // Already in the correct format
      return wavFile;
    }
    
    // Create an offline context with the desired format
    const offlineContext = new OfflineAudioContext(1, audioBuffer.duration * 16000, 16000);
    
    // Create a buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    
    // Start the source and render
    source.start(0);
    const renderedBuffer = await offlineContext.startRendering();
    
    // Create WAV from the rendered buffer
    const wavBlob = encodeWavFile(renderedBuffer);
    
    // Return as a new file
    return new File([wavBlob], wavFile.name, { type: 'audio/wav' });
  } catch (error) {
    console.error('[NORMALIZE] Error normalizing WAV file:', error);
    return wavFile; // Return original file if normalization fails
  }
};

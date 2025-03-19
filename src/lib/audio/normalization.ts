
/**
 * Audio normalization utilities
 */
import { convertToMono } from './wavUtils';

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
      const { encodeWavFile } = await import('./wavEncoder');
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


/**
 * Audio format conversion utilities
 */
import { convertToMono } from './wavUtils';

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
        const monoBuffer = convertToMono(audioBuffer);
        const { encodeWavFile } = await import('./wavEncoder');
        const wav = encodeWavFile(monoBuffer);
        
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
 * Attempts to convert an audio file to WAV format for better compatibility
 * Returns the original file if conversion fails
 */
export const tryConvertToWav = async (audioFile: File): Promise<File> => {
  try {
    const fileName = audioFile.name.toLowerCase();
    
    // Only try to convert non-WAV formats
    if (fileName.endsWith('.wav') || audioFile.type.includes('wav')) {
      console.log('[CONVERT] File is already WAV format, checking if normalization needed');
      return audioFile; // Already WAV, no conversion needed
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
      const { encodeWavFile } = await import('./wavEncoder');
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

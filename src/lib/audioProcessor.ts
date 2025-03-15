
// This utility handles audio file processing, chunking, and batch processing

/**
 * Processes audio in batches for transcription
 * Supports files up to 6 hours long (or ~360MB at typical bitrates)
 */

// Maximum size for a single batch (10MB is Google's sync API limit)
const MAX_BATCH_SIZE_BYTES = 9 * 1024 * 1024; // 9MB to be safe

// AudioContext for audio processing
let audioContext: AudioContext | null = null;

/**
 * Creates an AudioContext instance or returns the existing one
 */
export const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Converts a File to an AudioBuffer
 */
export const fileToAudioBuffer = async (file: File): Promise<AudioBuffer> => {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = getAudioContext();
  return await audioContext.decodeAudioData(arrayBuffer);
};

/**
 * Splits an AudioBuffer into smaller chunks of specified duration
 */
export const splitAudioBuffer = (
  buffer: AudioBuffer, 
  maxChunkDurationSec: number = 60
): Float32Array[] => {
  const chunks: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const samplesPerChunk = maxChunkDurationSec * sampleRate;
  const totalSamples = buffer.length;
  
  // Use the first channel for mono processing
  const audioData = buffer.getChannelData(0);
  
  // Split the audio data into chunks
  for (let i = 0; i < totalSamples; i += samplesPerChunk) {
    const chunkLength = Math.min(samplesPerChunk, totalSamples - i);
    const chunk = new Float32Array(chunkLength);
    
    // Copy data to the chunk
    for (let j = 0; j < chunkLength; j++) {
      chunk[j] = audioData[i + j];
    }
    
    chunks.push(chunk);
  }
  
  return chunks;
};

/**
 * Converts Float32Array audio data to WAV format as Blob
 */
export const float32ArrayToWav = (
  samples: Float32Array,
  sampleRate: number = 16000
): Blob => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  
  // Write WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk1size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, 1, true); // number of channels
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  
  // Write audio data
  floatTo16BitPCM(view, 44, samples);
  
  return new Blob([buffer], { type: 'audio/wav' });
};

// Helper function to write a string to a DataView
const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Helper function to convert Float32Array to 16-bit PCM
const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array): void => {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
};

/**
 * Estimates the file size in bytes for a WAV file of given duration
 */
export const estimateWavFileSize = (durationSec: number, sampleRate: number = 16000): number => {
  // Header size (44 bytes) + audio data (2 bytes per sample * sample rate * duration)
  return 44 + (2 * sampleRate * durationSec);
};

/**
 * Calculates optimal chunk duration based on MAX_BATCH_SIZE_BYTES
 */
export const calculateOptimalChunkDuration = (
  fileSize: number, 
  durationSec: number
): number => {
  const bytesPerSecond = fileSize / durationSec;
  const optimalDurationSec = MAX_BATCH_SIZE_BYTES / bytesPerSecond;
  
  // Ensure the duration is at least 5 seconds and at most 60 seconds
  return Math.max(5, Math.min(60, Math.floor(optimalDurationSec)));
};

/**
 * Creates File objects from audio chunks for API upload
 */
export const createChunkFiles = (
  chunks: Blob[],
  originalFilename: string
): File[] => {
  return chunks.map((chunk, index) => {
    const name = `${originalFilename.split('.')[0]}_part${index + 1}.wav`;
    return new File([chunk], name, { type: 'audio/wav' });
  });
};

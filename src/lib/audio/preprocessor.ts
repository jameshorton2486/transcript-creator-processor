
/**
 * Audio preprocessing utilities for improving audio quality before transcription
 */

/**
 * Normalizes audio volume to improve consistency
 * @param audioBuffer The audio buffer to normalize
 * @param targetLevel Target level for normalization (default -3dB)
 */
export const normalizeAudio = (audioBuffer: AudioBuffer, targetLevel: number = -3): AudioBuffer => {
  const audioCtx = new AudioContext();
  const normalizedBuffer = audioCtx.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  // Process each channel
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = normalizedBuffer.getChannelData(channel);
    
    // Find peak amplitude
    let peak = 0;
    for (let i = 0; i < inputData.length; i++) {
      const abs = Math.abs(inputData[i]);
      if (abs > peak) {
        peak = abs;
      }
    }
    
    // Calculate gain based on target level
    // Convert target level from dB to linear gain
    const targetGain = Math.pow(10, targetLevel/20);
    const gainFactor = peak > 0 ? targetGain / peak : 1;
    
    // Apply gain to each sample
    for (let i = 0; i < inputData.length; i++) {
      outputData[i] = inputData[i] * gainFactor;
    }
  }
  
  return normalizedBuffer;
};

/**
 * Simple noise gate to reduce background noise
 * @param audioBuffer The audio buffer to process
 * @param threshold Threshold below which audio is considered noise (0-1)
 */
export const applyNoiseGate = (audioBuffer: AudioBuffer, threshold: number = 0.01): AudioBuffer => {
  const audioCtx = new AudioContext();
  const processedBuffer = audioCtx.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  // Process each channel
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = processedBuffer.getChannelData(channel);
    
    // Apply noise gate
    for (let i = 0; i < inputData.length; i++) {
      // If sample amplitude is below threshold, reduce it significantly
      if (Math.abs(inputData[i]) < threshold) {
        outputData[i] = 0; // Gate is closed
      } else {
        outputData[i] = inputData[i]; // Gate is open
      }
    }
  }
  
  return processedBuffer;
};

/**
 * Simple DC offset removal
 * @param audioBuffer The audio buffer to process
 */
export const removeDCOffset = (audioBuffer: AudioBuffer): AudioBuffer => {
  const audioCtx = new AudioContext();
  const processedBuffer = audioCtx.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  // Process each channel
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = processedBuffer.getChannelData(channel);
    
    // Calculate DC offset (average amplitude)
    let sum = 0;
    for (let i = 0; i < inputData.length; i++) {
      sum += inputData[i];
    }
    const dcOffset = sum / inputData.length;
    
    // Remove DC offset
    for (let i = 0; i < inputData.length; i++) {
      outputData[i] = inputData[i] - dcOffset;
    }
  }
  
  return processedBuffer;
};

/**
 * Applies all preprocessing steps in a sensible order
 * @param audioBuffer The audio buffer to process
 */
export const preprocessAudio = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  console.log("Preprocessing audio for improved transcription quality...");
  
  // 1. Remove any DC offset first
  let processedBuffer = removeDCOffset(audioBuffer);
  
  // 2. Apply noise gate to reduce background noise
  processedBuffer = applyNoiseGate(processedBuffer, 0.01);
  
  // 3. Normalize audio volume last
  processedBuffer = normalizeAudio(processedBuffer, -3);
  
  console.log("Audio preprocessing complete");
  return processedBuffer;
};

/**
 * Process an audio file with all preprocessing steps
 * @param file Audio file to process
 */
export const preprocessAudioFile = async (file: File): Promise<ArrayBuffer> => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Apply preprocessing
    const processedBuffer = await preprocessAudio(audioBuffer);
    
    // Convert back to WAV format
    const wavBlob = await audioBufferToWav(processedBuffer);
    return await wavBlob.arrayBuffer();
  } catch (error) {
    console.error("Error preprocessing audio:", error);
    throw error;
  }
};

/**
 * Convert AudioBuffer to WAV format
 */
const audioBufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
  // Get audio data from all channels and convert to Float32Array
  const numberOfChannels = buffer.numberOfChannels;
  const length = buffer.length * numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  
  // Create the WAV file header
  const headerLength = 44;
  const dataLength = length * bytesPerSample;
  const fileLength = headerLength + dataLength;
  
  const arrayBuffer = new ArrayBuffer(fileLength);
  const view = new DataView(arrayBuffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length minus RIFF identifier length and file description length
  view.setUint32(4, fileLength - 8, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numberOfChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numberOfChannels * bytesPerSample, true);
  // bits per sample
  view.setUint16(34, bitsPerSample, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);
  
  // Write the PCM samples
  const channelData = new Array(numberOfChannels);
  for (let i = 0; i < numberOfChannels; i++) {
    channelData[i] = buffer.getChannelData(i);
  }
  
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      // Clamp the value to the 16-bit range
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      // Scale to 16-bit integer
      const value = (sample < 0) ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, value, true);
      offset += bytesPerSample;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

// Helper function to write a string to a DataView
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}


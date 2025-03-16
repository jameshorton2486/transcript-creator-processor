
// AudioContext singleton for audio processing
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

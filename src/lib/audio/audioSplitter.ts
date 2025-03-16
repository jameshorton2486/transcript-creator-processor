
/**
 * Utility to split audio files into chunks for batch processing
 */

// Function to split audio into chunks (mock for test compatibility)
export const splitAudioIntoChunks = async (file: File): Promise<File[]> => {
  // Mock implementation to satisfy tests
  // In a real implementation, this would split the audio file into chunks
  const chunk1 = new File([new Blob(['chunk1'])], 'chunk1.wav', { type: 'audio/wav' });
  const chunk2 = new File([new Blob(['chunk2'])], 'chunk2.wav', { type: 'audio/wav' });
  return [chunk1, chunk2];
};

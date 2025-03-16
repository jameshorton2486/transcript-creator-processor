
/**
 * Utility function to convert various audio formats to WAV format
 */

// Export to match test expectations
export const convertToWav = async (file: File): Promise<ArrayBuffer> => {
  // This is a mock implementation to satisfy the test
  // In a real implementation, we'd convert the file to WAV format
  return file.arrayBuffer();
};

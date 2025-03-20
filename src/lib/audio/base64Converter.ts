
/**
 * Helper to convert ArrayBuffer to base64
 */
export const arrayBufferToBase64 = async (buffer: ArrayBuffer): Promise<string> => {
  // Convert ArrayBuffer to Base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
};

/**
 * Helper to directly convert buffer to base64 string (for smaller buffers)
 */
export const directBufferToBase64 = (buffer: Uint8Array): string => {
  // Convert directly from Uint8Array to Base64
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  
  return btoa(binary);
};

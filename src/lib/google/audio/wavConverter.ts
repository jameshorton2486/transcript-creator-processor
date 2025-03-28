
/**
 * Utility to convert audio files to base64 for Google Speech API
 */

/**
 * Converts an audio file to base64 string
 */
export const convertAudioToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        if (typeof reader.result !== 'string') {
          // Convert ArrayBuffer to base64
          const arrayBuffer = reader.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          resolve(base64);
        } else {
          // Already a string (data URL), extract the base64 part
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read audio file'));
    };
    
    reader.readAsDataURL(file);
  });
};

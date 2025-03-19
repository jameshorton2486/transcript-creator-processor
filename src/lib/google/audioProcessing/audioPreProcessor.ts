
/**
 * Converts an ArrayBuffer to base64 encoding
 */
export const arrayBufferToBase64 = async (buffer: ArrayBuffer): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    try {
      const blob = new Blob([buffer], { type: 'audio/wav' });
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          const base64 = result.split(',')[1];
          
          if (!base64) {
            console.warn('Failed to extract base64 data. Attempting alternative encoding method.');
            // Fallback method for base64 conversion
            const bytes = new Uint8Array(buffer);
            let binary = '';
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            resolve(window.btoa(binary));
            return;
          }
          
          resolve(base64);
        } catch (parseError) {
          console.error('Error parsing FileReader result:', parseError);
          // Fallback method
          const bytes = new Uint8Array(buffer);
          let binary = '';
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          resolve(window.btoa(binary));
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error converting to base64:', error);
        reject(new Error('Failed to convert audio to base64 format.'));
      };
      
      reader.readAsDataURL(blob);
    } catch (blobError) {
      console.error('Error creating Blob:', blobError);
      reject(new Error('Failed to create Blob from audio data.'));
    }
  });
};

/**
 * Simple direct binary to base64 conversion
 * Used as a fallback when other methods fail
 */
export const directBufferToBase64 = (buffer: ArrayBuffer): string => {
  try {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } catch (error) {
    console.error('Error in direct base64 conversion:', error);
    throw new Error('Failed to convert audio to base64 format using direct method.');
  }
};

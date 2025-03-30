
/**
 * Authentication service for Deepgram API
 * Uses a server-side proxy to avoid CORS issues
 */

/**
 * Validate Deepgram API key using server-side proxy
 * @param apiKey The Deepgram API key to validate
 */
export const validateApiKey = async (apiKey: string): Promise<{ valid: boolean; message?: string }> => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      return { 
        valid: false, 
        message: 'API key is required' 
      };
    }

    // Use your backend API endpoint that will proxy the request to Deepgram
    const response = await fetch('/api/auth/validate-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        valid: false, 
        message: errorData.message || 'Invalid API key' 
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('API key validation error:', error);
    return { 
      valid: false, 
      message: 'Failed to validate API key. Please check your network connection.' 
    };
  }
};

/**
 * Mock validation function for development/testing when API proxy isn't available
 * @param apiKey The Deepgram API key to validate
 */
export const mockValidateApiKey = (apiKey: string): Promise<{ valid: boolean; message?: string }> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      if (!apiKey || apiKey.trim() === '') {
        resolve({ 
          valid: false, 
          message: 'API key is required' 
        });
      } else if (apiKey.length < 10) {
        resolve({ 
          valid: false, 
          message: 'Invalid API key format' 
        });
      } else {
        resolve({ valid: true });
      }
    }, 500);
  });
};

/**
 * Get API key from local storage
 */
export const getSavedApiKey = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem('deepgram_api_key');
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

/**
 * Save API key to local storage
 */
export const saveApiKey = (apiKey: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('deepgram_api_key', apiKey);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Remove API key from local storage
 */
export const clearApiKey = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem('deepgram_api_key');
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

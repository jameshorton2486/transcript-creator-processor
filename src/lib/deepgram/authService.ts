
/**
 * Authentication service for Deepgram API
 */
import { validateDeepgramApiKey, checkDeepgramApiStatus } from '../audio/deepgramApiValidator';

/**
 * Validate Deepgram API key
 * Tries to use a server-side proxy first, but falls back to direct validation
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

    // Try server-side validation first (if available)
    try {
      const response = await fetch('/api/auth/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (response.ok) {
        return { valid: true };
      }
      
      // If server-side validation fails with a proper error response, use that
      const errorData = await response.json().catch(() => null);
      if (errorData?.error) {
        return { 
          valid: false, 
          message: errorData.error 
        };
      }
    } catch (serverError) {
      console.log('Server-side validation not available, falling back to direct validation');
      // Continue to direct validation if server-side fails
    }

    // Fall back to direct validation if server-side isn't available
    const directResult = await validateDeepgramApiKey(apiKey);
    
    return {
      valid: directResult.isValid,
      message: directResult.message
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return { 
      valid: false, 
      message: 'Failed to validate API key. Please check your network connection.' 
    };
  }
};

/**
 * Check the status of a Deepgram API key
 * @param apiKey The Deepgram API key to check
 */
export const checkApiStatus = async (apiKey: string): Promise<{ active: boolean; message: string }> => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      return { 
        active: false, 
        message: 'API key is required' 
      };
    }

    // Try server-side check first (if available)
    try {
      const response = await fetch(`/api/auth/check-status?apiKey=${encodeURIComponent(apiKey)}`);
      
      if (response.ok) {
        const data = await response.json();
        return { 
          active: data.active, 
          message: data.message || (data.active ? 'API key is active' : 'API key is invalid or inactive')
        };
      }
    } catch (serverError) {
      console.log('Server-side status check not available, falling back to direct check');
      // Continue to direct check if server-side fails
    }

    // Fall back to direct check
    return await checkDeepgramApiStatus(apiKey);
  } catch (error) {
    console.error('API status check error:', error);
    return { 
      active: false, 
      message: 'Failed to check API status. Please check your network connection.'
    };
  }
};

/**
 * Mock validation function for development/testing when API validation isn't available
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
      } else if (apiKey.length < 20) {
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


/**
 * Authentication service for Deepgram API
 */
import { validateDeepgramApiKey as directValidateApiKey, checkDeepgramApiStatus } from '../audio/deepgramApiValidator';

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

    // Server options for validation - try multiple endpoints
    const serverEndpoints = [
      '/api/auth/validate-key',          // Next.js API route
      'http://localhost:4000/validate-key'  // Express proxy
    ];

    // Try server-side validation first
    for (const endpoint of serverEndpoints) {
      try {
        console.log(`Trying to validate via server endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: endpoint.includes('validate-key') ? 'POST' : 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: endpoint.includes('validate-key') ? JSON.stringify({ apiKey }) : undefined,
        });

        if (response.ok) {
          const data = await response.json();
          return { 
            valid: data.isValid || data.valid || false,
            message: data.message || (data.isValid ? 'API key is valid' : 'Invalid API key')
          };
        }
      } catch (serverError) {
        console.log(`Server validation endpoint ${endpoint} failed:`, serverError);
        // Continue to next endpoint or direct validation
      }
    }

    console.log('Server-side validation not available, falling back to direct validation');
    
    // Fall back to direct validation if server-side isn't available
    const directResult = await directValidateApiKey(apiKey);
    
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

    // Try server-side check with Express proxy first
    try {
      const response = await fetch(`http://localhost:4000/check-status?apiKey=${encodeURIComponent(apiKey)}`);
      
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

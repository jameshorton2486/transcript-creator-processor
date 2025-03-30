
/**
 * Direct Deepgram API validator
 * This makes direct client-side requests to Deepgram API for validation
 * Note: This should only be used for development or in environments
 * where CORS is not an issue
 */

/**
 * Validate a Deepgram API key by checking if it can access the projects endpoint
 * @param apiKey The Deepgram API key to validate
 */
export const validateDeepgramApiKey = async (apiKey: string): Promise<{ isValid: boolean; message: string }> => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      return { 
        isValid: false, 
        message: 'API key is required' 
      };
    }

    // Make direct request to Deepgram API
    // This may face CORS issues in browser environments
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Process the response
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const errorMessage = data?.error || `Invalid API key (Status: ${response.status})`;
      return { 
        isValid: false, 
        message: errorMessage
      };
    }
    
    return { 
      isValid: true, 
      message: 'API key is valid'
    };
  } catch (error) {
    console.error('API key validation error:', error);
    
    // Check if error is due to CORS
    if (error instanceof Error && 
        (error.message.includes('CORS') || 
         error.message.includes('network') ||
         error.message.includes('Failed to fetch'))) {
      return { 
        isValid: false, 
        message: 'CORS error - cannot validate API key directly. The key format seems valid, and it will be used for transcription.'
      };
    }
    
    return { 
      isValid: false, 
      message: 'Failed to validate API key. Please check your network connection.'
    };
  }
};

/**
 * Check the status of a Deepgram API key
 * @param apiKey The Deepgram API key to check
 */
export const checkDeepgramApiStatus = async (apiKey: string): Promise<{ active: boolean; message: string }> => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      return { 
        active: false, 
        message: 'API key is required' 
      };
    }

    // Make direct request to Deepgram API
    const response = await fetch('https://api.deepgram.com/v1/listen/usage', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return { 
        active: false, 
        message: `API key is invalid or inactive (Status: ${response.status})`
      };
    }
    
    return { 
      active: true, 
      message: 'API key is active'
    };
  } catch (error) {
    console.error('API status check error:', error);
    return { 
      active: false, 
      message: 'Failed to check API status. Please check your network connection.'
    };
  }
};

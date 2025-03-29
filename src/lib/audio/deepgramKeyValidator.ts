
/**
 * Utility for validating Deepgram API keys
 */

/**
 * Result of validating a Deepgram API key
 */
export interface DeepgramKeyValidationResult {
  isValid: boolean;
  message: string;
  statusCode?: number;
}

/**
 * Test if a Deepgram API key is valid by making a sample request
 * 
 * @param apiKey The Deepgram API key to test
 * @returns Object containing validation result
 */
export const validateDeepgramApiKey = async (apiKey: string): Promise<DeepgramKeyValidationResult> => {
  if (!apiKey || apiKey.trim() === '') {
    return {
      isValid: false,
      message: 'API key cannot be empty'
    };
  }

  try {
    // Use the projects endpoint to test the key
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      // Add a timeout to avoid long waits
      signal: AbortSignal.timeout(10000)
    });

    console.log(`Deepgram API key validation status: ${response.status}`);

    // Handle different response status codes
    if (response.status === 200) {
      return {
        isValid: true,
        message: 'API key is valid',
        statusCode: response.status
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        isValid: false,
        message: 'Invalid API key or insufficient permissions',
        statusCode: response.status
      };
    } else if (response.status === 429) {
      // Still consider valid but rate limited
      return {
        isValid: true,
        message: 'API key is valid but rate limited',
        statusCode: response.status
      };
    } else {
      const errorData = await response.json().catch(() => null);
      return {
        isValid: false,
        message: errorData?.message || `Unexpected error (${response.status})`,
        statusCode: response.status
      };
    }
  } catch (error) {
    // Handle network errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error validating Deepgram API key:', errorMessage);
    
    // If there's a network error but the key format looks reasonable, give benefit of doubt
    if (apiKey.trim().length >= 20) {
      return {
        isValid: true,
        message: 'Key format appears valid, but network error prevented confirmation'
      };
    }
    
    return {
      isValid: false,
      message: `Validation failed: ${errorMessage}`
    };
  }
};

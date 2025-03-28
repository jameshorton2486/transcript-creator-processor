
/**
 * Authentication-related functions for AssemblyAI
 */

export interface ApiKeyTestResult {
  isValid: boolean;
  message: string;
  statusCode?: number;
}

/**
 * Tests if the API key is valid with detailed feedback
 */
export const testApiKey = async (apiKey: string): Promise<ApiKeyTestResult> => {
  try {
    console.log('[ASSEMBLY] Testing API key validity...');
    
    // Check for empty API key
    if (!apiKey || apiKey.trim() === '') {
      console.error('[ASSEMBLY] Empty API key provided');
      return {
        isValid: false,
        message: 'API key cannot be empty'
      };
    }
    
    // Basic format validation
    const trimmedKey = apiKey.trim();
    if (!/^[a-zA-Z0-9]{32,}$/.test(trimmedKey)) {
      console.error('[ASSEMBLY] API key format appears invalid');
      return {
        isValid: false,
        message: 'API key format is invalid'
      };
    }
    
    // Make a request to a lightweight endpoint to test the API key
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'GET',
        headers: {
          'Authorization': trimmedKey,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`[ASSEMBLY] API key test status: ${response.status}`);
      
      // Handle specific response status codes
      if (response.status === 401) {
        console.error('[ASSEMBLY] API key invalid (unauthorized)');
        return {
          isValid: false,
          message: 'API key is invalid or expired',
          statusCode: 401
        };
      }
      
      if (response.status === 403) {
        console.error('[ASSEMBLY] API key lacks permissions');
        return {
          isValid: false,
          message: 'API key lacks sufficient permissions',
          statusCode: 403
        };
      }
      
      if (response.status === 429) {
        console.warn('[ASSEMBLY] API key valid but rate limited');
        return {
          isValid: true,
          message: 'API key is valid but rate limited',
          statusCode: 429
        };
      }
      
      if (!response.ok) {
        // For other non-ok responses that aren't auth errors
        console.warn(`[ASSEMBLY] API key test returned status ${response.status}`);
        try {
          const errorData = await response.json();
          console.warn('[ASSEMBLY] Error data:', errorData);
          return {
            isValid: response.status < 400,
            message: errorData.error || `Unexpected error (${response.status})`,
            statusCode: response.status
          };
        } catch {
          return {
            isValid: response.status < 400,
            message: `Unexpected error (${response.status})`,
            statusCode: response.status
          };
        }
      }
      
      console.log('[ASSEMBLY] API key is valid');
      return {
        isValid: true,
        message: 'API key is valid',
        statusCode: response.status
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error; // Re-throw to be caught by outer try/catch
    }
  } catch (error: any) {
    // Specific error handling
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      console.error('[ASSEMBLY] API key test timed out');
      return {
        isValid: false,
        message: 'API key validation timed out'
      };
    } else if (error.message && (
      error.message.includes('network') || 
      error.message.includes('fetch') ||
      error.message.includes('connect')
    )) {
      console.error('[ASSEMBLY] Network error during API key test:', error);
      return {
        isValid: false,
        message: 'Network error, please check your connection'
      };
    } else {
      console.error('[ASSEMBLY] API key test error:', error);
      return {
        isValid: false,
        message: `Unexpected error: ${error.message || 'Unknown error'}`
      };
    }
  }
};

/**
 * Legacy function that returns boolean for backward compatibility
 * @deprecated Use testApiKey which provides detailed results
 */
export const isApiKeyValid = async (apiKey: string): Promise<boolean> => {
  const result = await testApiKey(apiKey);
  return result.isValid;
};

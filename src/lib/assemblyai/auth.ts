
/**
 * Authentication-related functions for AssemblyAI
 */

/**
 * Tests if the API key is valid
 */
export const testApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    console.log('[ASSEMBLY] Testing API key validity...');
    
    // Check for empty API key
    if (!apiKey || apiKey.trim() === '') {
      console.error('[ASSEMBLY] Empty API key provided');
      return false;
    }
    
    // Make a request to a lightweight endpoint to test the API key
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'GET',
      headers: {
        'Authorization': apiKey
      },
      // Set a timeout for the request
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`[ASSEMBLY] API key test status: ${response.status}`);
    
    if (response.status === 401) {
      console.error('[ASSEMBLY] API key invalid (unauthorized)');
      return false;
    }
    
    if (!response.ok) {
      // Even if the response isn't 200 OK, if it's not an auth error (401), 
      // the key might still be valid (e.g., rate limiting, server error)
      console.warn(`[ASSEMBLY] API key test returned status ${response.status}`);
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.warn('[ASSEMBLY] Error data:', errorData);
      
      // For most non-401 errors, we'll consider the key valid but log the issue
      return response.status !== 401;
    }
    
    console.log('[ASSEMBLY] API key is valid');
    return true;
  } catch (error) {
    console.error('[ASSEMBLY] API key test error:', error);
    return false;
  }
};

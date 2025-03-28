
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
    
    // Basic format validation
    if (!/^[a-zA-Z0-9]{32,}$/.test(apiKey.trim())) {
      console.error('[ASSEMBLY] API key format appears invalid');
      return false;
    }
    
    // Make a request to a lightweight endpoint to test the API key
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'GET',
      headers: {
        'Authorization': apiKey.trim()
      },
      // Set a timeout for the request
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`[ASSEMBLY] API key test status: ${response.status}`);
    
    if (response.status === 401) {
      console.error('[ASSEMBLY] API key invalid (unauthorized)');
      return false;
    }
    
    if (response.status === 403) {
      console.error('[ASSEMBLY] API key lacks permissions');
      return false;
    }
    
    if (response.status === 429) {
      console.warn('[ASSEMBLY] API key valid but rate limited');
      // Still return true since the key itself is valid
      return true;
    }
    
    if (!response.ok) {
      // For other non-ok responses that aren't auth errors
      console.warn(`[ASSEMBLY] API key test returned status ${response.status}`);
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.warn('[ASSEMBLY] Error data:', errorData);
      
      // For most non-401/403 errors, consider the key potentially valid
      return response.status < 400;
    }
    
    console.log('[ASSEMBLY] API key is valid');
    return true;
  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      console.error('[ASSEMBLY] API key test timed out');
    } else if (error.message && (
      error.message.includes('network') || 
      error.message.includes('fetch') ||
      error.message.includes('connect')
    )) {
      console.error('[ASSEMBLY] Network error during API key test:', error);
    } else {
      console.error('[ASSEMBLY] API key test error:', error);
    }
    return false;
  }
};

import { apiKeyStorage } from './apiHelpers';

/**
 * Validate a Deepgram API key
 * Attempts to validate via proxy server first, then falls back to direct validation
 * 
 * @param apiKey The API key to validate
 * @returns Object indicating if the key is valid and any error message
 */
export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; message?: string }> {
  console.log("[DEEPGRAM AUTH SERVICE] Starting API key validation for key:", { 
    keyLength: apiKey?.length,
    keyPrefix: apiKey ? `${apiKey.substring(0, 4)}...` : 'undefined'
  });
  
  if (!apiKey || apiKey.trim() === '') {
    console.log("[DEEPGRAM AUTH SERVICE] No API key provided");
    return { 
      valid: false, 
      message: 'API key is required' 
    };
  }

  // Try validating through proxy server first
  try {
    console.log("[DEEPGRAM AUTH SERVICE] Attempting to validate via proxy server...");
    const proxyResponse = await fetch('http://localhost:4000/validate-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey }),
    });
    
    console.log("[DEEPGRAM AUTH SERVICE] Proxy server response status:", proxyResponse.status);
    
    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      console.log("[DEEPGRAM AUTH SERVICE] Proxy validation result:", data);
      return {
        valid: data.valid,
        message: data.message
      };
    } else {
      console.log("[DEEPGRAM AUTH SERVICE] Proxy validation failed, falling back to direct API test");
    }
  } catch (proxyError) {
    console.error("[DEEPGRAM AUTH SERVICE] Error using proxy server:", proxyError);
    console.log("[DEEPGRAM AUTH SERVICE] Falling back to direct API test");
  }
  
  // Fall back to direct API test
  try {
    console.log("[DEEPGRAM AUTH SERVICE] Attempting direct Deepgram API validation...");
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log("[DEEPGRAM AUTH SERVICE] Direct API response status:", response.status);
    
    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `Invalid API key (Status: ${response.status})`;
      } catch (e) {
        errorMessage = `API returned status ${response.status}`;
      }
      
      console.error("[DEEPGRAM AUTH SERVICE] API validation failed:", errorMessage);
      return { 
        valid: false, 
        message: errorMessage
      };
    }
    
    console.log("[DEEPGRAM AUTH SERVICE] API key validated successfully");
    return { 
      valid: true 
    };
  } catch (error) {
    console.error("[DEEPGRAM AUTH SERVICE] Error during API validation:", error);
    
    // Network error detection
    if (error instanceof Error) {
      const errorMessage = error.message;
      console.log("[DEEPGRAM AUTH SERVICE] Error message:", errorMessage);
      
      // CORS error detection
      if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
        console.log("[DEEPGRAM AUTH SERVICE] CORS error detected, performing fallback validation");
        
        // Basic check of API key format as fallback
        const seemsValid = /^[a-zA-Z0-9]{24,}$/.test(apiKey);
        if (seemsValid) {
          console.log("[DEEPGRAM AUTH SERVICE] API key format seems valid despite CORS error");
          return {
            valid: true,
            message: 'API key format seems valid, but could not verify with Deepgram due to CORS restrictions. Using proxy server is recommended.'
          };
        }
      }
      
      // Other network error handling
      if (errorMessage.includes('network') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('Network request failed')) {
        console.log("[DEEPGRAM AUTH SERVICE] Network error detected");
        return {
          valid: false,
          message: 'Network error occurred. Please check your internet connection and try again.'
        };
      }
    }
    
    return { 
      valid: false, 
      message: error instanceof Error ? error.message : 'Unknown error validating API key'
    };
  }
}

/**
 * Mock API key validation for testing without making network requests
 */
export function mockValidateApiKey(apiKey: string): { valid: boolean; message?: string } {
  console.log("[DEEPGRAM AUTH SERVICE] Running mock API key validation");
  
  if (!apiKey || apiKey.trim() === '') {
    return { 
      valid: false, 
      message: 'API key is required' 
    };
  }
  
  // Simple format validation
  if (/^[a-zA-Z0-9]{24,}$/.test(apiKey)) {
    return { 
      valid: true,
      message: 'API key format is valid (mock validation)'
    };
  }
  
  return { 
    valid: false, 
    message: 'Invalid API key format (mock validation)'
  };
}

/**
 * Get saved API key from storage
 */
export function getSavedApiKey(): string {
  return apiKeyStorage.get() || '';
}

/**
 * Save API key to storage
 */
export function saveApiKey(apiKey: string): void {
  apiKeyStorage.save(apiKey);
}

/**
 * Clear API key from storage
 */
export function clearApiKey(): void {
  apiKeyStorage.clear();
}

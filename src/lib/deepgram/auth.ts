/**
 * Authentication and API key validation for Deepgram
 */
import { ApiKeyValidationResult } from '../../hooks/useDeepgramTranscription/types';
import { safePromise } from '../../hooks/useTranscription/promiseUtils';

// Base URL for Deepgram API
const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1';

/**
 * Test if the provided API key is valid by making a test request to Deepgram
 */
export async function testApiKey(apiKey: string): Promise<{
  isValid: boolean;
  message?: string;
}> {
  console.log("[DEEPGRAM AUTH] Testing API key validity...", { 
    keyLength: apiKey?.length,
    keyPrefix: apiKey?.substring(0, 4) + '...',
  });

  if (!apiKey || apiKey.trim() === '') {
    console.log("[DEEPGRAM AUTH] Empty API key provided");
    return {
      isValid: false,
      message: 'API key is required'
    };
  }

  try {
    console.log("[DEEPGRAM AUTH] Making test request to Deepgram API...");
    
    // First try the proxy server if it's available
    try {
      console.log("[DEEPGRAM AUTH] Attempting to use proxy server for validation");
      const proxyResponse = await fetch('http://localhost:4000/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });
      
      console.log("[DEEPGRAM AUTH] Proxy server response status:", proxyResponse.status);
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        console.log("[DEEPGRAM AUTH] Proxy validation result:", data);
        return {
          isValid: data.valid,
          message: data.message
        };
      } else {
        console.log("[DEEPGRAM AUTH] Proxy validation failed, falling back to direct validation");
      }
    } catch (proxyError) {
      console.log("[DEEPGRAM AUTH] Error using proxy server:", proxyError);
      console.log("[DEEPGRAM AUTH] Falling back to direct validation");
    }
    
    // Fall back to direct API call
    console.log("[DEEPGRAM AUTH] Attempting direct Deepgram API validation...");
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log("[DEEPGRAM AUTH] Direct API response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("[DEEPGRAM AUTH] API validation failed:", errorData);
      return {
        isValid: false,
        message: errorData?.error || `Invalid API key (Status: ${response.status})`
      };
    }
    
    console.log("[DEEPGRAM AUTH] API key validation successful");
    return {
      isValid: true,
    };
  } catch (error) {
    console.error("[DEEPGRAM AUTH] API validation failed due to network error", error);
    
    // Special handling for network errors
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('Network request failed') ||
          error.message.includes('CORS')) {
        // CORS or network issue likely
        console.log("[DEEPGRAM AUTH] Detected CORS or network error, checking key format");
        
        // Basic format validation (not guaranteeing it works, just checking format)
        const isFormatValid = /^[a-zA-Z0-9]{32,}$/.test(apiKey);
        if (isFormatValid) {
          console.log("[DEEPGRAM AUTH] API key format looks valid, might be a CORS issue");
          return {
            isValid: true,
            message: 'Unable to verify key online. Format appears valid, but functionality is not guaranteed.'
          };
        }
      }
    }
    
    return {
      isValid: false,
      message: 'Failed to validate API key. Please check your network connection and try again.'
    };
  }
}

/**
 * Retrieves the stored API key from localStorage.
 * @returns Stored API key or empty string if not found
 */
export function retrieveStoredApiKey(): string {
  try {
    return localStorage.getItem('deepgramApiKey') || '';
  } catch {
    return '';
  }
}

/**
 * Stores the API key in localStorage.
 * @param apiKey API key to store
 */
export function storeApiKey(apiKey: string): void {
  try {
    localStorage.setItem('deepgramApiKey', apiKey);
  } catch (error) {
    console.error('Failed to store API key:', error);
  }
}

/**
 * Removes the stored API key from localStorage.
 */
export function clearApiKey(): void {
  try {
    localStorage.removeItem('deepgramApiKey');
  } catch (error) {
    console.error('Failed to clear API key:', error);
  }
}

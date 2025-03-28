/**
 * Authentication and API key validation for Deepgram
 */
import { ApiKeyValidationResult } from '../../hooks/useDeepgramTranscription/types';

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1';

/**
 * Tests the validity of a Deepgram API key.
 * @param apiKey API key to validate
 * @returns Result of the validation, including validity and a descriptive message
 */
export async function testApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    console.log('[DEEPGRAM] Testing API key validity...');

    // Check for empty API key
    if (!apiKey || apiKey.trim() === '') {
      console.error('[DEEPGRAM] Empty API key provided');
      return {
        isValid: false,
        message: 'API key cannot be empty'
      };
    }

    // Updated regex to accept both old format (dg_...) and new API key formats
    // This removes the strict format check to be more flexible with future changes
    const trimmedKey = apiKey.trim();
    
    // Lightweight endpoint call to test key
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${DEEPGRAM_API_URL}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${trimmedKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`[DEEPGRAM] API key test status: ${response.status}`);

      if (response.status === 401 || response.status === 403) {
        console.error('[DEEPGRAM] Unauthorized or insufficient permissions');
        return {
          isValid: false,
          message: 'API key is invalid or lacks permissions',
          statusCode: response.status
        };
      }

      if (response.status === 429) {
        console.warn('[DEEPGRAM] API key valid but rate limited');
        return {
          isValid: true,
          message: 'API key is valid but rate limited',
          statusCode: 429
        };
      }

      if (!response.ok) {
        console.warn(`[DEEPGRAM] Unexpected status ${response.status}`);
        const errorData = await response.json().catch(() => null);
        return {
          isValid: false,
          message: errorData?.message || `Unexpected error (${response.status})`,
          statusCode: response.status
        };
      }

      console.log('[DEEPGRAM] API key is valid');
      return {
        isValid: true,
        message: 'API key is valid',
        statusCode: response.status
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      console.error('[DEEPGRAM] API key test timed out');
      return {
        isValid: false,
        message: 'API key validation timed out'
      };
    } else if (error.message && (
      error.message.includes('network') || 
      error.message.includes('fetch') ||
      error.message.includes('connect')
    )) {
      console.error('[DEEPGRAM] Network error during API key test:', error);
      return {
        isValid: false,
        message: 'Network error, please check your connection'
      };
    } else {
      console.error('[DEEPGRAM] Unexpected error:', error);
      return {
        isValid: false,
        message: `Unexpected error: ${error.message || 'Unknown error'}`
      };
    }
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

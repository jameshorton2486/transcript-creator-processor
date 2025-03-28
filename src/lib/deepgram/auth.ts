
/**
 * Authentication and API key validation for Deepgram
 */
import { ApiKeyValidationResult } from '../../hooks/useDeepgramTranscription/types';
import { safePromise } from '../../hooks/useTranscription/promiseUtils';

// Base URL for Deepgram API
const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1';

/**
 * Test if a Deepgram API key is valid
 * @param apiKey API key to test
 * @returns Result of validation, including validity and error message if any
 */
export async function testApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    console.log('[DEEPGRAM] Testing API key validity...');

    if (!apiKey || apiKey.trim() === '') {
      console.error('[DEEPGRAM] Empty API key provided');
      return {
        isValid: false,
        message: 'API key cannot be empty'
      };
    }

    const trimmedKey = apiKey.trim();

    // Basic format validation - Deepgram keys should be of reasonable length
    if (trimmedKey.length < 20) {
      return {
        isValid: false,
        message: 'API key format appears invalid (too short)'
      };
    }

    // Always try to validate with the actual API, even in development
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await safePromise(fetch(`${DEEPGRAM_API_URL}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${trimmedKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      }), 8000);

      clearTimeout(timeoutId);
      console.log(`[DEEPGRAM] API key test status: ${response.status}`);

      if (response.status === 401 || response.status === 403) {
        return {
          isValid: false,
          message: 'API key is invalid or lacks permissions',
          statusCode: response.status
        };
      }

      if (response.status === 429) {
        return {
          isValid: true,
          message: 'API key is valid but rate limited',
          statusCode: 429
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          isValid: false,
          message: errorData?.message || `Unexpected error (${response.status})`,
          statusCode: response.status
        };
      }

      storeApiKey(trimmedKey);
      return {
        isValid: true,
        message: 'API key is valid',
        statusCode: response.status
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      // If network error but format appears valid, provide a clear message
      // but still allow using the key with a warning
      console.warn('[DEEPGRAM] API validation failed due to network error', error);
      storeApiKey(trimmedKey);
      return {
        isValid: true,
        message: 'API key format looks valid, but validation failed due to network error. You can try using it, but it may not work.',
        skipApiValidation: true
      };
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      storeApiKey(apiKey.trim());
      return {
        isValid: true,
        message: 'API key format looks valid (API call timed out, but proceeding)',
        skipApiValidation: true
      };
    } else if (error.message && (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('connect')
    )) {
      storeApiKey(apiKey.trim());
      return {
        isValid: true,
        message: 'Key format looks valid (network error encountered, but proceeding)',
        skipApiValidation: true
      };
    } else {
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

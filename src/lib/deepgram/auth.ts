
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
  if (!apiKey.trim()) {
    return {
      isValid: false,
      message: 'API key cannot be empty',
    };
  }

  try {
    const response = await fetch(`${DEEPGRAM_API_URL}/projects`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return {
        isValid: true,
        message: 'API key is valid',
        statusCode: response.status,
      };
    }

    let message: string;
    switch (response.status) {
      case 401:
      case 403:
        message = 'Invalid API key or insufficient permissions';
        break;
      case 429:
        message = 'Rate limit exceeded';
        break;
      default:
        try {
          const errorData = await response.json();
          message = errorData.message || response.statusText;
        } catch {
          message = response.statusText || 'Unknown error';
        }
    }

    return {
      isValid: false,
      message,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Network error occurred',
      statusCode: 0,
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

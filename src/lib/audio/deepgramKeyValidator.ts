
import { validateApiKey } from '../deepgram/authService';

/**
 * Validate a Deepgram API key
 * @param apiKey The API key to validate
 * @returns Whether the key is valid and any error message
 */
export const validateDeepgramApiKey = async (apiKey: string): Promise<{ isValid: boolean; message: string }> => {
  try {
    const result = await validateApiKey(apiKey);
    return {
      isValid: result.valid,
      message: result.message || (result.valid ? 'API key is valid' : 'Invalid API key')
    };
  } catch (error) {
    console.error('Error validating Deepgram API key:', error);
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Unknown error validating API key'
    };
  }
};

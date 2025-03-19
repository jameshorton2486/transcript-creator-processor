
/**
 * Module for testing Google API key validity
 */

/**
 * Tests if the API key is valid by making a minimal request
 */
export const testApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    console.log('[API TEST] Testing Google API key validity...');
    
    if (!apiKey || apiKey.trim() === '') {
      console.error('[API TEST] Empty API key provided');
      return false;
    }
    
    // Make a minimal request to the Google Speech API
    const response = await fetch(
      `https://speech.googleapis.com/v1/operations?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log(`[API TEST] Status code: ${response.status}`);
    
    if (response.status === 200) {
      console.log('[API TEST] API key is valid');
      return true;
    }
    
    // If the response is 400, it could be because it's an empty request, which is expected
    // What's important is that the API key was accepted (no 403 or 401)
    if (response.status !== 403 && response.status !== 401) {
      console.log('[API TEST] API key appears valid (no auth errors)');
      return true;
    }
    
    // Get detailed error information
    const errorData = await response.json().catch(() => null);
    console.error('[API TEST] API key invalid. Response:', errorData);
    
    return false;
  } catch (error) {
    console.error('[API TEST] API key test error:', error);
    return false;
  }
};

/**
 * Performs a complete test of the Google Speech-to-Text API with a minimal audio sample
 * This ensures not just API key validity but also proper API access and configuration
 */
export const testSpeechApiAccess = async (apiKey: string): Promise<{isValid: boolean, message?: string}> => {
  try {
    console.log('[API TEST] Testing complete Speech-to-Text API access...');
    
    // Generate a tiny audio sample (1 second of silence) - this is a minimal WAV file in base64
    const tinyAudioSample = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YQAAAAA=';
    
    // Make a minimal transcription request
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
          },
          audio: {
            content: tinyAudioSample,
          },
        }),
      }
    );
    
    const data = await response.json();
    console.log('[API TEST] Speech API test response status:', response.status);
    
    if (response.status === 200) {
      console.log('[API TEST] Speech-to-Text API access confirmed');
      return { isValid: true };
    } else if (data.error) {
      console.error('[API TEST] Speech API test error:', data.error);
      
      // Check for specific error types
      if (data.error.message.includes('API key not valid')) {
        return { isValid: false, message: 'Invalid API key' };
      } else if (data.error.message.includes('billing')) {
        return { isValid: false, message: 'Billing not enabled for this Google Cloud project' };
      } else if (data.error.message.includes('permission') || data.error.message.includes('enabled')) {
        return { isValid: false, message: 'Speech-to-Text API not enabled in Google Cloud project' };
      } else if (data.error.message.includes('quota')) {
        return { isValid: false, message: 'API quota exceeded' };
      } else {
        return { isValid: false, message: data.error.message };
      }
    }
    
    return { isValid: false, message: 'Unknown error testing Speech API' };
  } catch (error: any) {
    console.error('[API TEST] Speech API test error:', error);
    return { isValid: false, message: `Connection error: ${error.message}` };
  }
};

/**
 * Validates if the project has necessary API permissions by checking specific errors
 */
export const checkApiPermissions = async (apiKey: string): Promise<{
  hasPermission: boolean;
  needsBilling: boolean;
  apiEnabled: boolean;
  message: string;
}> => {
  try {
    // Default response
    const result = {
      hasPermission: false,
      needsBilling: false,
      apiEnabled: false,
      message: 'Unknown API permission status'
    };
    
    // Test with a minimal request
    const { isValid, message } = await testSpeechApiAccess(apiKey);
    
    if (isValid) {
      result.hasPermission = true;
      result.apiEnabled = true;
      result.message = 'API key has all required permissions';
      return result;
    }
    
    // Check specific error messages for different permission issues
    if (message?.includes('billing')) {
      result.needsBilling = true;
      result.apiEnabled = true;
      result.message = 'Billing needs to be enabled for this Google Cloud project';
    } else if (message?.includes('enable') || message?.includes('API not enabled')) {
      result.apiEnabled = false;
      result.message = 'Speech-to-Text API is not enabled for this project';
    } else if (message?.includes('invalid') || message?.includes('API key')) {
      result.message = 'The API key is invalid or does not have proper permissions';
    } else {
      result.message = message || 'Unknown permission issue';
    }
    
    return result;
  } catch (error: any) {
    return {
      hasPermission: false,
      needsBilling: false,
      apiEnabled: false,
      message: `Error checking API permissions: ${error.message}`
    };
  }
};

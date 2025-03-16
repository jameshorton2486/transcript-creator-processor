
// Module for testing Google API key validity

/**
 * Tests if the API key is valid by making a minimal request
 */
export const testApiKey = async (apiKey: string): Promise<boolean> => {
  try {
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
    
    // If the response is 400, it could be because it's an empty request, which is expected
    // What's important is that the API key was accepted (no 403 or 401)
    return response.status !== 403 && response.status !== 401;
  } catch (error) {
    console.error('API key test error:', error);
    return false;
  }
};

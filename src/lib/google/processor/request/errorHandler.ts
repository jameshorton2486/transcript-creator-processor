
/**
 * Error handling utility for Google Speech API requests
 */

/**
 * Get a detailed, user-friendly error message based on the error response
 */
export const getDetailedErrorMessage = (error: any): string => {
  // Check if it's an API error response
  if (error.response && error.response.data && error.response.data.error) {
    const googleError = error.response.data.error;
    
    // Check for specific error cases
    if (googleError.message && googleError.message.includes('API key')) {
      return `Authentication error: ${googleError.message}. Please check your Google Cloud API key.`;
    }
    
    if (googleError.message && googleError.message.includes('quota')) {
      return `Quota exceeded: Your Google Cloud account has reached its usage limits. Please check your quota in the Google Cloud Console.`;
    }
    
    if (googleError.message && googleError.message.includes('Permission')) {
      return `Permission denied: ${googleError.message}. Make sure Speech-to-Text API is enabled for your project.`;
    }
    
    return `Google API error: ${googleError.message}`;
  }
  
  // Check for network errors
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. The audio file may be too large or your network connection may be unstable.';
  }
  
  if (error.code === 'ENOTFOUND') {
    return 'Network error: Unable to connect to Google Speech API. Please check your internet connection.';
  }
  
  // Default error message
  return error.message || 'An unknown error occurred during transcription.';
};

/**
 * Handle specific API-related errors with more detailed logging and response
 */
export const handleApiError = (error: any, requestId: string): Error => {
  // Log detailed error response
  if (error.response) {
    console.error(`[API:${requestId}] [${new Date().toISOString()}] Google API error response:`, {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      headers: error.response.headers
    });
    
    // Provide more specific guidance for common errors
    if (error.response.data?.error?.message?.includes('audio quality')) {
      console.error(`[API:${requestId}] Poor audio quality detected. Providing detailed troubleshooting.`);
      throw new Error('Google API reports poor audio quality. Try: 1) Converting audio to 16-bit WAV mono, 2) Ensuring clear speech with minimal background noise, 3) Using a smaller audio segment for testing.');
    }
    
    // Handle specific encoding errors
    if (error.response.data?.error?.message?.includes('Encoding in RecognitionConfig') ||
        error.response.data?.error?.message?.includes('sample_rate_hertz')) {
      console.error(`[API:${requestId}] Encoding/sample rate mismatch detected. Will retry with auto-detection.`);
      throw new Error('Google API detected encoding/sample rate mismatch. The application will automatically retry with auto-detection.');
    }
  }
  
  // Get a detailed error message
  const errorMessage = getDetailedErrorMessage(error);
  return new Error(errorMessage);
};

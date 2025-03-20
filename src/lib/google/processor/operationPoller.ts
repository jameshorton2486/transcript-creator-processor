import axios from 'axios';

/**
 * Improved polling mechanism for long-running operations with better cancellation support
 * @param {string} apiKey - Google API key
 * @param {string} operationName - The operation name to poll
 * @param {string} requestId - Request ID for logging
 * @returns {Promise<any>} The operation result
 */
export const pollOperationStatus = async (apiKey: string, operationName: string, requestId: string): Promise<any> => {
  let attempts = 0;
  const maxAttempts = 60; // Allow up to 60 attempts (10 minutes with exponential backoff)
  const baseDelay = 5000; // Start with 5-second delay
  
  // Create a controller to help with cancellations
  const controller = new AbortController();
  const signal = controller.signal;
  
  // Add event listeners to cancel polling when user navigates away
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      controller.abort();
    }
  };
  
  const handleBeforeUnload = () => {
    controller.abort();
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  try {
    while (attempts < maxAttempts) {
      // Check if polling has been cancelled
      if (signal.aborted) {
        console.log(`[API:${requestId}] Polling cancelled due to page navigation`);
        throw new Error('Operation cancelled due to page navigation');
      }
      
      attempts++;
      
      try {
        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(1.5, attempts - 1), 60000); // Cap at 60 seconds
        
        // Log polling attempt
        console.log(`[API:${requestId}] Polling operation ${operationName}, attempt ${attempts}/${maxAttempts}, waiting ${delay/1000}s`);
        
        // Wait before polling
        await new Promise(resolve => {
          const timeoutId = setTimeout(resolve, delay);
          
          // If aborted during timeout, clear the timeout
          signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            resolve(null);
          }, { once: true });
        });
        
        // Check if polling has been cancelled during wait
        if (signal.aborted) {
          console.log(`[API:${requestId}] Polling cancelled during wait`);
          throw new Error('Operation cancelled due to page navigation');
        }
        
        // Check operation status with timeout
        const pollingController = new AbortController();
        const pollingSignal = pollingController.signal;
        
        // Set timeout for this specific polling request
        const timeoutId = setTimeout(() => pollingController.abort(), 30000);
        
        // Check operation status
        const response = await axios.get(
          `https://speech.googleapis.com/v1/operations/${operationName}?key=${apiKey}`,
          {
            headers: {
              'Accept': 'application/json',
            },
            timeout: 30000, // 30-second timeout for polling requests
            signal: pollingSignal
          }
        );
        
        // Clear timeout as request completed
        clearTimeout(timeoutId);
        
        // If operation is done, return the result
        if (response.data.done) {
          console.log(`[API:${requestId}] Operation completed in ${attempts} polling attempts`);
          
          // Check for errors
          if (response.data.error) {
            throw new Error(`Operation failed: ${response.data.error.message}`);
          }
          
          // Return the response result
          return response.data.response;
        }
        
        // Log progress if available
        if (response.data.metadata && response.data.metadata.progressPercent) {
          console.log(`[API:${requestId}] Operation progress: ${response.data.metadata.progressPercent}%`);
        }
      } catch (error: any) {
        // Check if polling has been cancelled
        if (signal.aborted || (error.name === 'AbortError')) {
          console.log(`[API:${requestId}] Polling request aborted`);
          throw new Error('Operation cancelled due to page navigation or timeout');
        }
        
        console.error(`[API:${requestId}] Error polling operation:`, error.message);
        
        // If we've reached max attempts, throw error
        if (attempts >= maxAttempts) {
          throw new Error(`Operation polling timed out after ${maxAttempts} attempts: ${error.message}`);
        }
        
        // Otherwise continue polling
        console.log(`[API:${requestId}] Continuing to poll despite error...`);
      }
    }
    
    throw new Error(`Operation did not complete within the allowed time (${maxAttempts} polling attempts)`);
  } finally {
    // Clean up event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }
};

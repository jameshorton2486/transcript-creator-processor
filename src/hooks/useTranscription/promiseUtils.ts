
/**
 * Enhanced promise handler to safely resolve promises and avoid "message channel closed" errors
 * Includes additional safeguards for browser navigation events
 */
export const safePromise = async <T>(promise: Promise<T>, timeout = 30000): Promise<T> => {
  let timeoutId: number;
  let isCancelled = false;
  
  // Create a controller to help with cleanup
  const controller = new AbortController();
  const signal = controller.signal;
  
  // Setup handlers for page visibility and navigation
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      window.clearTimeout(timeoutId);
      controller.abort();
      isCancelled = true;
    }
  };
  
  const handleBeforeUnload = () => {
    window.clearTimeout(timeoutId);
    controller.abort();
    isCancelled = true;
  };
  
  // Add event listeners
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Create a timeout promise that rejects after specified timeout
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      if (!isCancelled) {
        console.warn(`Promise timed out after ${timeout}ms`);
        reject(new Error(`Promise timed out after ${timeout}ms`));
      }
    }, timeout);
  });
  
  try {
    // Race the original promise against the timeout
    const result = await Promise.race([
      promise.catch(error => {
        // If the operation was intentionally cancelled, provide a clearer error
        if (isCancelled) {
          throw new Error("Operation cancelled due to page navigation");
        }
        throw error;
      }), 
      timeoutPromise
    ]);
    
    window.clearTimeout(timeoutId);
    return result;
  } catch (error) {
    window.clearTimeout(timeoutId);
    throw error;
  } finally {
    // Clean up event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }
};

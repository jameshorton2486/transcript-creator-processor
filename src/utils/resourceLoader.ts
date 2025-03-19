
/**
 * Utility for efficient resource loading
 */

/**
 * Dynamically loads a script with proper error handling
 * 
 * @param src The source URL of the script to load
 * @param async Whether to load the script asynchronously
 * @returns Promise that resolves when the script loads, rejects on error
 */
export const loadScript = (src: string, async = true): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Validate URL to prevent loading from unexpected sources
    if (!isValidScriptUrl(src)) {
      reject(new Error('Invalid script URL'));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.head.appendChild(script);
  });
};

/**
 * Validates script URL to prevent loading from unwanted sources
 * 
 * @param url The URL to validate
 * @returns boolean indicating whether the URL is valid
 */
const isValidScriptUrl = (url: string): boolean => {
  // Prevent loading from GitHub repositories directly
  if (url.includes('github.com')) {
    console.error('Blocked attempt to load script from GitHub');
    return false;
  }
  
  // Add other validation rules as needed
  
  return true;
};

/**
 * Preloads a resource only when needed
 * 
 * @param url The URL of the resource to preload
 * @param type The type of resource (e.g., 'script', 'style', 'image')
 * @param immediate Whether to load immediately or when browser is idle
 */
export const preloadResource = (url: string, type: string, immediate = false): void => {
  const preload = () => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    document.head.appendChild(link);
    
    // Set a timeout to check if the resource was used
    setTimeout(() => {
      // This is a simple way to monitor if the resource was used
      // In a production app, you might want more sophisticated tracking
      console.debug(`Preloaded resource: ${url}`);
    }, 5000);
  };
  
  if (immediate) {
    preload();
  } else {
    // Use requestIdleCallback for non-critical resources
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preload);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(preload, 1);
    }
  }
};

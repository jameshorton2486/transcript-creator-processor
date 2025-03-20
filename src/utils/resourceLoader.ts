
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
 * Preloads a resource only when it will be used immediately
 * Modified to avoid "preloaded but not used" console warnings
 * 
 * @param url The URL of the resource to preload
 * @param type The type of resource (e.g., 'script', 'style', 'image')
 * @param immediate Whether to load immediately or when browser is idle
 * @param ttl Time-to-live in ms before removing the preload if unused (default: 3000ms)
 */
export const preloadResource = (
  url: string, 
  type: string, 
  immediate = false, 
  ttl = 3000
): void => {
  const preload = () => {
    // Check if the resource is already loaded or preloaded
    const existingLinks = document.querySelectorAll(`link[href="${url}"]`);
    if (existingLinks.length > 0) {
      console.debug(`Resource already preloaded: ${url}`);
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    // Add crossorigin attribute for fonts
    if (type === 'font') {
      link.setAttribute('crossorigin', 'anonymous');
    }
    
    document.head.appendChild(link);
    
    // Remove the preload link if the resource isn't used within the TTL
    // This helps prevent "preloaded but not used" console warnings
    setTimeout(() => {
      // Check if the resource has been used
      const isResourceUsed = type === 'script' 
        ? document.querySelector(`script[src="${url}"]`) !== null
        : type === 'style'
          ? document.querySelector(`link[rel="stylesheet"][href="${url}"]`) !== null
          : false;
          
      if (!isResourceUsed) {
        console.debug(`Removing unused preload for: ${url}`);
        document.head.removeChild(link);
      }
    }, ttl);
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


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
 * Improved preload resource function that avoids "preloaded but not used" warnings
 * Only preloads resources when they're about to be used
 * 
 * @param url The URL of the resource to preload
 * @param type The type of resource (e.g., 'script', 'style', 'image')
 * @param immediate Whether to load immediately or when the resource will be used soon
 */
export const preloadResource = (
  url: string, 
  type: string, 
  immediate = false
): void => {
  // Check if the resource is already loaded or preloaded
  const existingLinks = document.querySelectorAll(`link[href="${url}"]`);
  const existingScripts = document.querySelectorAll(`script[src="${url}"]`);
  const existingStyles = document.querySelectorAll(`link[rel="stylesheet"][href="${url}"]`);
  
  if (existingLinks.length > 0 || existingScripts.length > 0 || existingStyles.length > 0) {
    console.debug(`Resource already loaded or preloaded: ${url}`);
    return;
  }
  
  // For immediate loading, use the appropriate element instead of preload
  if (immediate) {
    if (type === 'script') {
      loadScript(url).catch(err => console.error(err));
      return;
    } else if (type === 'style') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
      return;
    }
  }
  
  // Only preload if we're really going to use it soon
  const preload = () => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    // Add crossorigin attribute for fonts
    if (type === 'font') {
      link.setAttribute('crossorigin', 'anonymous');
    }
    
    // Create a timeout to actually load the resource after preloading
    // This ensures the preload is actually used
    setTimeout(() => {
      if (type === 'script') {
        loadScript(url).catch(err => console.error(err));
      } else if (type === 'style') {
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = url;
        document.head.appendChild(styleLink);
      }
      // For other resource types, the preload is enough
    }, 100); // Small delay to ensure preload happens first
    
    document.head.appendChild(link);
  };
  
  // Use requestIdleCallback for non-critical resources
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preload);
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(preload, 1);
  }
};


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
 * Improved resource loading function that avoids "preloaded but not used" warnings
 * Only loads resources when they're actually needed
 * 
 * @param url The URL of the resource to load
 * @param type The type of resource (e.g., 'script', 'style', 'image')
 */
export const loadResource = (url: string, type: string): void => {
  // Check if the resource is already loaded
  const existingLinks = document.querySelectorAll(`link[href="${url}"]`);
  const existingScripts = document.querySelectorAll(`script[src="${url}"]`);
  const existingStyles = document.querySelectorAll(`link[rel="stylesheet"][href="${url}"]`);
  
  if (existingLinks.length > 0 || existingScripts.length > 0 || existingStyles.length > 0) {
    console.debug(`Resource already loaded: ${url}`);
    return;
  }
  
  // Load the resource based on type
  if (type === 'script') {
    loadScript(url).catch(err => console.error(err));
  } else if (type === 'style') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  } else if (type === 'font') {
    // Use font-display: swap for better performance with fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet'; // Use stylesheet instead of preload to avoid warnings
    link.href = url;
    document.head.appendChild(link);
    
    // Add font-display: swap CSS if loading Google Fonts
    if (url.includes('fonts.googleapis.com')) {
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: 'CustomFont';
          font-display: swap;
        }
      `;
      document.head.appendChild(style);
    }
  } else if (type === 'image') {
    const img = new Image();
    img.src = url;
  }
};

/**
 * Use prefetch for resources that will be needed later
 * This is less aggressive than preload and won't trigger warnings
 * 
 * @param url The URL of the resource to prefetch
 */
export const prefetchResource = (url: string): void => {
  // Check if already prefetched
  const existingLinks = document.querySelectorAll(`link[href="${url}"]`);
  if (existingLinks.length > 0) {
    return;
  }
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
};


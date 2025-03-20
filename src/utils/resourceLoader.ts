
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
  } else if (type === 'tracking-pixel') {
    // Handle tracking pixels correctly by creating a proper noscript iframe
    // This avoids preload warnings as it's loaded directly without preloading
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    
    iframe.src = url;
    iframe.height = '1';
    iframe.width = '1';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    
    noscript.appendChild(iframe);
    document.body.appendChild(noscript);
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

/**
 * Correctly loads tracking pixels (like Facebook Pixel)
 * This method ensures pixels are loaded appropriately without preload warnings
 * 
 * @param pixelId The ID of the tracking pixel
 * @param type The type of pixel ('facebook', 'google', etc.)
 */
export const loadTrackingPixel = (pixelId: string, type: 'facebook' | 'google' | 'other'): void => {
  if (type === 'facebook') {
    // Create Facebook Pixel script correctly without preloading
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
    
    // Add noscript fallback
    loadResource(`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`, 'tracking-pixel');
  } else if (type === 'google') {
    // Handle Google tracking pixel implementation
    console.log('Google tracking pixel support would be implemented here');
  } else {
    console.log('Other tracking pixel types would be implemented here');
  }
};

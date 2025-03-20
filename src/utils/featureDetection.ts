
/**
 * Utility for checking browser feature support
 */

/**
 * Checks if a specific browser feature is supported
 * 
 * @param featureName The name of the feature to check
 * @returns boolean indicating whether the feature is supported
 */
export const isFeatureSupported = (featureName: string): boolean => {
  // Check if the feature exists in the navigator object
  if (featureName in navigator) {
    return true;
  }
  
  // Check if the feature is available as a permission
  if ('permissions' in navigator && navigator.permissions) {
    try {
      // Only query for permissions that are likely to be supported
      if (SUPPORTED_FEATURE_POLICIES.includes(featureName)) {
        // @ts-ignore - TypeScript might not know about the permissions API
        return navigator.permissions.query({ name: featureName })
          .then(() => true)
          .catch(() => false);
      }
    } catch {
      return false;
    }
  }
  
  return false;
};

/**
 * Gets a list of supported features from a provided list
 * 
 * @param featureNames Array of feature names to check
 * @returns Array of supported feature names
 */
export const getSupportedFeatures = (featureNames: string[]): string[] => {
  return featureNames.filter(isFeatureSupported);
};

/**
 * Modern supported feature policies that can be used
 * Updated list of well-supported features across browsers
 * Removed deprecated APIs: vr, ambient-light-sensor, battery, browsing-topics
 */
export const SUPPORTED_FEATURE_POLICIES = [
  'accelerometer',
  'autoplay',
  'camera',
  'document-domain',
  'encrypted-media',
  'fullscreen',
  'geolocation',
  'gyroscope',
  'magnetometer',
  'microphone',
  'midi',
  'payment',
  'picture-in-picture',
  'publickey-credentials-get',
  'screen-wake-lock',
  'sync-xhr',
  'usb',
  'web-share',
  'xr-spatial-tracking'
];

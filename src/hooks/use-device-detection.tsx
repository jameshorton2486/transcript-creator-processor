
import * as React from "react";
import { getSupportedFeatures } from "../utils/featureDetection";

export interface DeviceCapabilities {
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasGeolocation: boolean;
  hasFullscreen: boolean;
  hasBluetooth: boolean;
  /**
   * Use this for immersive AR/VR experiences (replaces deprecated 'vr')
   */
  hasXRSpatialTracking: boolean;
  isMobile: boolean;
}

/**
 * Hook to detect device capabilities safely using modern browser APIs
 */
export function useDeviceDetection(): DeviceCapabilities {
  const [capabilities, setCapabilities] = React.useState<DeviceCapabilities>({
    hasCamera: false,
    hasMicrophone: false,
    hasGeolocation: false,
    hasFullscreen: false,
    hasBluetooth: false,
    hasXRSpatialTracking: false,
    isMobile: false,
  });

  React.useEffect(() => {
    // Get supported features
    const featuresSupported = getSupportedFeatures([
      'camera',
      'microphone',
      'geolocation',
      'fullscreen',
      'bluetooth',
      'xr-spatial-tracking'
    ]);

    // Detect mobile
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || (window.innerWidth < 768);

    setCapabilities({
      hasCamera: featuresSupported.includes('camera'),
      hasMicrophone: featuresSupported.includes('microphone'),
      hasGeolocation: featuresSupported.includes('geolocation'),
      hasFullscreen: featuresSupported.includes('fullscreen'),
      hasBluetooth: featuresSupported.includes('bluetooth'),
      hasXRSpatialTracking: featuresSupported.includes('xr-spatial-tracking'),
      isMobile: isMobileDevice,
    });
  }, []);

  return capabilities;
}

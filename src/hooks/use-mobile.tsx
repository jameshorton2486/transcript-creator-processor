
import * as React from "react"
import { useDeviceDetection } from "./use-device-detection"

const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect if the current device is a mobile device
 * @returns boolean indicating if the device is mobile
 */
export function useIsMobile() {
  const { isMobile } = useDeviceDetection();
  return isMobile;
}

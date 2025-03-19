
// Fix type declarations to ensure consistency with actual implementations
interface Window {
  pdfjsLib: any;
  mammoth: any;
}

// Add TypeScript definitions for performance.memory
interface Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

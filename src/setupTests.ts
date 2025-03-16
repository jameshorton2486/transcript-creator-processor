
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the global Audio constructor
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn(),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}));

// Mock window.URL.createObjectURL and revokeObjectURL
if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', {
    value: vi.fn(() => 'mock-url')
  });
}

if (typeof window.URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'revokeObjectURL', {
    value: vi.fn()
  });
}

// Silence console errors during tests
console.error = vi.fn();

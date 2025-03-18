
// Increased file size threshold from 10MB to 200MB
export const LARGE_FILE_THRESHOLD = 200 * 1024 * 1024;

export type TranscriptionHookState = {
  file: File | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  isBatchProcessing: boolean;
  apiKey: string;
  documentFiles: File[];
};


import { TranscriptionResult } from './types';

// Use import.meta.env instead of process.env for Vite
export const shouldUseMockResponses = (): boolean => {
  return import.meta.env.VITE_USE_MOCK_RESPONSES === 'true';
};

export const mockTranscription = (): TranscriptionResult => {
  return {
    transcript: "This is a mock transcription response. In a real application, this would be the transcribed text from your audio file. The Deepgram API would have processed your audio and returned the spoken content as text.",
    confidence: 0.95,
    words: [
      { word: "This", start: 0.01, end: 0.21, confidence: 0.99 },
      { word: "is", start: 0.22, end: 0.31, confidence: 0.99 },
      { word: "a", start: 0.32, end: 0.38, confidence: 0.99 },
      { word: "mock", start: 0.39, end: 0.58, confidence: 0.98 },
      { word: "transcription", start: 0.59, end: 1.1, confidence: 0.97 }
    ],
    metadata: {
      request_id: "mock-request-id",
      transaction_key: "mock-transaction",
      sha256: "mock-sha256",
      created: new Date().toISOString(),
      duration: 62.3,
      channels: 1,
      models: ["mock-model"]
    }
  };
};

export const formatTranscriptionResult = (result: any): TranscriptionResult => {
  // This would normally format a raw Deepgram response into the TranscriptionResult type
  return mockTranscription();
};

export const createDeepgramUrl = (): string => {
  return "https://api.deepgram.com/v1/listen";
};

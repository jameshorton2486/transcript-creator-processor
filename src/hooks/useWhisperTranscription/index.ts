
// This file re-exports AssemblyAI transcription hook to prevent breaking existing imports
// Whisper functionality has been completely removed in favor of AssemblyAI

import { useAssemblyAITranscription } from "@/hooks/useAssemblyAITranscription";

export { useAssemblyAITranscription as useWhisperTranscription };

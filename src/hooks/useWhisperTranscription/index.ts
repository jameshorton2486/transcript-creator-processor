
/**
 * This file now exclusively uses Deepgram transcription
 * It's kept for backwards compatibility with existing code
 */
import { useDeepgramTranscription } from "@/hooks/useDeepgramTranscription";

export { useDeepgramTranscription as useWhisperTranscription };

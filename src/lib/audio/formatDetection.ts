
/**
 * Audio format detection utilities for AssemblyAI
 */

/**
 * Detects audio format based on file mime type or extension
 */
export const detectAudioFormat = (file: File): { format: string } => {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (fileName.endsWith('.flac') || mimeType.includes('flac')) {
    return { format: 'flac' };
  } else if (fileName.endsWith('.mp3') || mimeType.includes('mp3') || mimeType.includes('mpeg')) {
    return { format: 'mp3' };
  } else if (fileName.endsWith('.wav') || mimeType.includes('wav')) {
    return { format: 'wav' };
  } else if (fileName.endsWith('.ogg') || mimeType.includes('ogg')) {
    return { format: 'ogg' };
  } else if (fileName.endsWith('.m4a') || mimeType.includes('m4a')) {
    return { format: 'm4a' };
  } else if (fileName.endsWith('.webm') || mimeType.includes('webm')) {
    return { format: 'webm' };
  } else if (fileName.endsWith('.mp4') || mimeType.includes('mp4')) {
    return { format: 'mp4' };
  } else if (fileName.endsWith('.mov') || mimeType.includes('quicktime')) {
    return { format: 'mov' };
  } else {
    return { format: 'unknown' };
  }
};

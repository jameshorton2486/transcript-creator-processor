
/**
 * Format the AssemblyAI transcription response to match our application's format
 */
export const formatTranscriptionResult = (result: any, fileName: string): any => {
  // Console log for debugging
  console.log('[ASSEMBLY] Formatting transcription result:', {
    resultType: typeof result,
    hasText: Boolean(result?.text),
    textLength: result?.text?.length || 0,
    hasWords: Boolean(result?.words?.length),
    hasChapters: Boolean(result?.chapters?.length)
  });

  if (!result || !result.text) {
    console.warn('[ASSEMBLY] Warning: No text content in transcription result');
    return {
      results: {
        transcripts: [{
          transcript: "No transcript was generated. The audio may not contain recognizable speech.",
          confidence: 0
        }],
        channels: []
      }
    };
  }

  // Extract the transcript text
  const transcriptText = result.text;
  const confidence = result.confidence || 0.8;

  // Format the response to match our expected format
  return {
    results: {
      transcripts: [{
        transcript: transcriptText,
        confidence
      }],
      channels: [{
        alternatives: [{
          transcript: transcriptText,
          confidence
        }]
      }]
    },
    // Add additional metadata from AssemblyAI
    metadata: {
      fileName,
      duration: result.audio_duration,
      wordCount: result.words?.length || 0,
      chapters: result.chapters || [],
      highlights: result.auto_highlights_result || [],
      entities: result.entities || []
    }
  };
};


import React, { useEffect, useRef } from 'react';

interface RawTranscriptViewProps {
  transcript: string;
  textAreaRef?: React.RefObject<HTMLTextAreaElement>;
}

export const RawTranscriptView: React.FC<RawTranscriptViewProps> = ({ transcript, textAreaRef }) => {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const actualRef = textAreaRef || localRef;
  
  // Enhanced logging to debug transcript issues
  useEffect(() => {
    if (actualRef.current) {
      // Force a re-render of the textarea to ensure it displays the content correctly
      const textarea = actualRef.current;
      textarea.style.height = 'auto';
      
      // Optionally scroll to top when new content is loaded
      textarea.scrollTop = 0;
      
      // Enhanced logging with more information about the transcript
      console.log("RawTranscriptView received transcript:", {
        length: transcript?.length,
        sample: transcript?.substring(0, 100),
        type: typeof transcript,
        isEmpty: transcript === '',
        isUndefined: transcript === undefined,
        isNull: transcript === null,
        hasNonWhitespace: transcript?.trim()?.length > 0,
        firstChars: transcript?.substring(0, 20)?.replace(/\n/g, "\\n"),
        asciiCodes: transcript?.substring(0, 20)?.split('').map(c => c.charCodeAt(0))
      });
      
      // Check if there might be invisible characters
      if (transcript && transcript.length > 0 && transcript.trim().length === 0) {
        console.warn("Transcript contains only whitespace characters!");
        // Log the character codes to see what's in there
        const charCodes = transcript.split('').map(c => c.charCodeAt(0));
        console.warn("Character codes in transcript:", charCodes);
      }
    }
  }, [transcript, actualRef]);
  
  // Make sure we always have a string, even if transcript is undefined or null
  const safeTranscript = transcript || '';
  
  // Enhanced display - debugging mode that shows transcript details
  const hasTextContent = safeTranscript.trim().length > 0;
  
  return (
    <div className="relative w-full h-full">
      {!hasTextContent && (
        <div className="absolute top-0 left-0 right-0 p-2 bg-amber-100 text-amber-800 text-xs border-b border-amber-200 z-10">
          Debug: Transcript is empty or contains only whitespace
        </div>
      )}
      <textarea
        ref={actualRef}
        className="w-full h-full p-6 text-sm font-mono border-0 focus:outline-none focus:ring-0 resize-none bg-white text-slate-800"
        value={safeTranscript}
        readOnly
        aria-label="Raw transcript text"
        style={{
          minHeight: '200px', // Ensure a minimum height
          color: 'black', // Force text to be black for visibility
          opacity: 1 // Ensure full visibility
        }}
      />
    </div>
  );
};

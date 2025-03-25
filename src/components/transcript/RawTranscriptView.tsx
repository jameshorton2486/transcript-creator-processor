
import React, { useEffect, useRef } from 'react';

interface RawTranscriptViewProps {
  transcript: string;
  textAreaRef?: React.RefObject<HTMLTextAreaElement>;
}

export const RawTranscriptView: React.FC<RawTranscriptViewProps> = ({ transcript, textAreaRef }) => {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const actualRef = textAreaRef || localRef;
  
  // Add console log to verify transcript content
  console.log("RawTranscriptView received:", { 
    length: transcript?.length, 
    sample: transcript?.substring(0, 100),
    hasContent: Boolean(transcript)
  });
  
  // Ensure textarea adjusts to content when it changes
  useEffect(() => {
    if (actualRef.current) {
      // Force a re-render of the textarea to ensure it displays the content correctly
      const textarea = actualRef.current;
      textarea.style.height = 'auto';
      
      // Optionally scroll to top when new content is loaded
      textarea.scrollTop = 0;
    }
  }, [transcript, actualRef]);
  
  return (
    <textarea
      ref={actualRef}
      className="w-full h-full p-6 text-sm font-mono border-0 focus:outline-none focus:ring-0 resize-none"
      value={transcript}
      readOnly
    />
  );
};


import React, { useEffect, useRef } from 'react';

interface RawTranscriptViewProps {
  transcript: string;
  textAreaRef?: React.RefObject<HTMLTextAreaElement>;
}

export const RawTranscriptView: React.FC<RawTranscriptViewProps> = ({ transcript, textAreaRef }) => {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const actualRef = textAreaRef || localRef;
  
  // Add enhanced console log to verify transcript content in more detail
  console.log("RawTranscriptView received:", { 
    length: transcript?.length, 
    sample: transcript?.substring(0, 100),
    hasContent: Boolean(transcript),
    isString: typeof transcript === 'string',
    firstChar: transcript?.[0],
    lastChar: transcript?.[transcript?.length - 1]
  });
  
  // Ensure textarea adjusts to content when it changes
  useEffect(() => {
    if (actualRef.current) {
      // Force a re-render of the textarea to ensure it displays the content correctly
      const textarea = actualRef.current;
      textarea.style.height = 'auto';
      
      // Optionally scroll to top when new content is loaded
      textarea.scrollTop = 0;
      
      // Additional debug to confirm the textarea received the text
      console.log("Textarea received text:", { 
        value: textarea.value?.length,
        visible: textarea.offsetWidth > 0 && textarea.offsetHeight > 0
      });
    }
  }, [transcript, actualRef]);
  
  // Make sure we always have a string, even if transcript is undefined or null
  const safeTranscript = transcript || '';
  
  return (
    <textarea
      ref={actualRef}
      className="w-full h-full p-6 text-sm font-mono border-0 focus:outline-none focus:ring-0 resize-none"
      value={safeTranscript}
      readOnly
      aria-label="Raw transcript text"
    />
  );
};

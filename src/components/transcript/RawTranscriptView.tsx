
import React from 'react';

interface RawTranscriptViewProps {
  text: string;
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
}

export const RawTranscriptView: React.FC<RawTranscriptViewProps> = ({ text, textAreaRef }) => {
  return (
    <textarea
      ref={textAreaRef}
      className="w-full h-full p-6 text-sm font-mono border-0 focus:outline-none focus:ring-0 resize-none"
      value={text}
      readOnly
    />
  );
};

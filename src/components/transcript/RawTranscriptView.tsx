
import React from 'react';

interface RawTranscriptViewProps {
  transcript: string;
  textAreaRef?: React.RefObject<HTMLTextAreaElement>;
}

export const RawTranscriptView: React.FC<RawTranscriptViewProps> = ({ transcript, textAreaRef }) => {
  return (
    <textarea
      ref={textAreaRef}
      className="w-full h-full p-6 text-sm font-mono border-0 focus:outline-none focus:ring-0 resize-none"
      value={transcript}
      readOnly
    />
  );
};

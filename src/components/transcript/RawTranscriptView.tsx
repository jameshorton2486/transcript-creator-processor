
import React, { RefObject } from 'react';
import { Textarea } from "@/components/ui/textarea";

interface RawTranscriptViewProps {
  transcript: string;
  textAreaRef?: RefObject<HTMLTextAreaElement>;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export const RawTranscriptView: React.FC<RawTranscriptViewProps> = ({
  transcript,
  textAreaRef,
  onChange,
  readOnly = true
}) => {
  return (
    <Textarea
      ref={textAreaRef}
      value={transcript}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      readOnly={readOnly}
      className="min-h-[200px] h-full w-full font-mono text-sm resize-none"
      style={{ height: "calc(100vh - 300px)" }}
    />
  );
};

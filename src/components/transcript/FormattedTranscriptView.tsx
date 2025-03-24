
import React from 'react';

interface FormattedTranscriptViewProps {
  formattedText: string;
}

export const FormattedTranscriptView: React.FC<FormattedTranscriptViewProps> = ({ formattedText }) => {
  return (
    <div className="prose max-w-none p-6 h-full">
      {formattedText.split('\n').map((line, i) => {
        // Apply special styling to speaker labels
        if (/^(Speaker \d+:|[A-Z][A-Z\s']+:)/.test(line)) {
          return (
            <div key={i} className="mt-4 font-semibold">
              {line}
            </div>
          );
        } 
        // Apply special styling to Q&A format
        else if (/^(Q|A):/.test(line)) {
          return (
            <div key={i} className="mt-3 font-semibold">
              {line}
            </div>
          );
        }
        // Regular text
        else {
          return <p key={i} className="my-1">{line}</p>;
        }
      })}
    </div>
  );
};

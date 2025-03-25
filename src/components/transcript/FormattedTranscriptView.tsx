
import React from 'react';

interface FormattedTranscriptViewProps {
  formattedText: string;
}

export const FormattedTranscriptView: React.FC<FormattedTranscriptViewProps> = ({ formattedText }) => {
  return (
    <div className="prose max-w-none p-6 h-full bg-white overflow-auto">
      <div className="mx-auto max-w-4xl shadow-sm rounded-sm border border-slate-100 p-8 bg-white">
        {/* Document styling */}
        <div className="font-serif leading-relaxed text-slate-800">
          {formattedText.split('\n').map((line, i) => {
            // Apply special styling to speaker labels
            if (/^(Speaker \d+:|[A-Z][A-Z\s']+:)/.test(line)) {
              return (
                <div key={i} className="mt-4 font-semibold text-slate-900">
                  {line}
                </div>
              );
            } 
            // Apply special styling to Q&A format
            else if (/^(Q|A):/.test(line)) {
              return (
                <div key={i} className="mt-3 font-semibold text-slate-900">
                  {line}
                </div>
              );
            }
            // Regular text with proper indentation
            else if (line.trim()) {
              return (
                <p key={i} className="my-1 pl-6 text-justify">
                  {line}
                </p>
              );
            } else {
              // Empty line
              return <div key={i} className="h-4"></div>;
            }
          })}
        </div>
      </div>
    </div>
  );
};

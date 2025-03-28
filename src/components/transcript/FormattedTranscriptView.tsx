
import React, { useEffect, useRef } from 'react';

interface FormattedTranscriptViewProps {
  formattedText: string;
}

export const FormattedTranscriptView: React.FC<FormattedTranscriptViewProps> = ({ formattedText }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Enhanced debugging for FormattedTranscriptView
  useEffect(() => {
    console.log("FormattedTranscriptView received text:", {
      length: formattedText?.length,
      sample: formattedText?.substring(0, 100),
      type: typeof formattedText,
      isEmpty: formattedText === '',
      isUndefined: formattedText === undefined,
      isNull: formattedText === null,
      hasNonWhitespace: formattedText?.trim()?.length > 0,
    });
    
    if (containerRef.current && formattedText) {
      containerRef.current.scrollTop = 0;
    }
  }, [formattedText]);
  
  // Make sure we always have a string, even if formattedText is undefined or null
  const safeText = formattedText || '';
  
  // If there's no content, show a placeholder with high visibility and debugging info
  if (!safeText.trim()) {
    return (
      <div 
        ref={containerRef} 
        className="prose max-w-none p-6 h-full bg-white overflow-auto"
        aria-label="Empty transcript view"
      >
        <div className="mx-auto max-w-4xl p-8 bg-white border border-amber-200 rounded-sm">
          <p className="text-amber-600 text-center font-medium">
            No transcript content available to display
          </p>
          <p className="text-center text-slate-500 mt-2">
            Use the transcription tools in the left panel to create a transcript.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef} 
      className="prose max-w-none p-6 h-full bg-white overflow-auto"
      aria-label="Formatted transcript view"
    >
      <div className="mx-auto max-w-4xl shadow-sm rounded-sm border border-slate-100 p-8 bg-white">
        {/* Document styling with improved visibility */}
        <div className="font-serif leading-relaxed text-slate-800">
          {safeText.split('\n').map((line, i) => {
            // Apply special styling to speaker labels
            if (/^(Speaker \d+:|[A-Z][A-Z\s']+:)/.test(line)) {
              return (
                <div key={i} className="mt-4 font-semibold text-black">
                  {line}
                </div>
              );
            } 
            // Apply special styling to Q&A format
            else if (/^(Q|A):/.test(line)) {
              return (
                <div key={i} className="mt-3 font-semibold text-black">
                  {line}
                </div>
              );
            }
            // Regular text with proper indentation
            else if (line.trim()) {
              return (
                <p key={i} className="my-1 pl-6 text-black">
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

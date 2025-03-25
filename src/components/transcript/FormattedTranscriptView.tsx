
import React, { useEffect, useRef } from 'react';

interface FormattedTranscriptViewProps {
  formattedText: string;
}

export const FormattedTranscriptView: React.FC<FormattedTranscriptViewProps> = ({ formattedText }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Add enhanced console log to verify formatted text is received in detail
  console.log("FormattedTranscriptView received:", { 
    length: formattedText?.length, 
    sample: formattedText?.substring(0, 100),
    hasContent: Boolean(formattedText),
    isString: typeof formattedText === 'string',
    lineCount: formattedText?.split('\n')?.length
  });
  
  // Scroll to top when content changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      
      // Additional debug to confirm the container has the formatted text
      console.log("FormattedView container:", {
        childCount: containerRef.current.querySelectorAll('p, div').length,
        visible: containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0,
        height: containerRef.current.offsetHeight
      });
    }
  }, [formattedText]);
  
  // Make sure we always have a string, even if formattedText is undefined or null
  const safeText = formattedText || '';
  
  return (
    <div ref={containerRef} className="prose max-w-none p-6 h-full bg-white overflow-auto">
      <div className="mx-auto max-w-4xl shadow-sm rounded-sm border border-slate-100 p-8 bg-white">
        {/* Document styling */}
        <div className="font-serif leading-relaxed text-slate-800">
          {safeText.split('\n').map((line, i) => {
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

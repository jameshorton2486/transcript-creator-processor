
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
    lineCount: formattedText?.split('\n')?.length,
    formattedTextValue: formattedText // Log the actual value
  });
  
  // Scroll to top when content changes and check CSS visibility
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      
      // Check if content is visible - add debug information to console
      const containerStyle = window.getComputedStyle(containerRef.current);
      console.log("FormattedView container style:", {
        color: containerStyle.color,
        backgroundColor: containerStyle.backgroundColor,
        visibility: containerStyle.visibility,
        display: containerStyle.display,
        opacity: containerStyle.opacity,
        height: containerStyle.height,
        width: containerStyle.width,
        overflow: containerStyle.overflow
      });
      
      // Additional debug to confirm the container has the formatted text
      console.log("FormattedView container:", {
        childCount: containerRef.current.querySelectorAll('p, div').length,
        visible: containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0,
        height: containerRef.current.offsetHeight,
        contentHeight: containerRef.current.scrollHeight
      });
    }
  }, [formattedText]);
  
  // Make sure we always have a string, even if formattedText is undefined or null
  const safeText = formattedText || '';
  
  // If there's no content, show a placeholder with high visibility
  if (!safeText.trim()) {
    return (
      <div ref={containerRef} className="prose max-w-none p-6 h-full bg-white overflow-auto">
        <div className="mx-auto max-w-4xl p-8 bg-white border border-red-200 rounded-sm">
          <p className="text-red-600 text-center font-medium">
            No formatted transcript content available to display
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="prose max-w-none p-6 h-full bg-white overflow-auto">
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

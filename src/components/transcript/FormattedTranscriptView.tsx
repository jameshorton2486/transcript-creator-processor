
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
      asciiCodes: formattedText?.substring(0, 20)?.split('').map(c => c.charCodeAt(0))
    });
    
    // Check if there might be invisible characters
    if (formattedText && formattedText.length > 0 && formattedText.trim().length === 0) {
      console.warn("FormattedText contains only whitespace characters!");
      // Log the character codes to see what's in there
      const charCodes = formattedText.split('').map(c => c.charCodeAt(0));
      console.warn("Character codes in formattedText:", charCodes);
    }
    
    if (containerRef.current && formattedText) {
      containerRef.current.scrollTop = 0;
    }
  }, [formattedText]);
  
  // Make sure we always have a string, even if formattedText is undefined or null
  const safeText = formattedText || '';
  
  // If there's no content, show a placeholder with high visibility and debugging info
  if (!safeText.trim()) {
    return (
      <div ref={containerRef} className="prose max-w-none p-6 h-full bg-white overflow-auto">
        <div className="mx-auto max-w-4xl p-8 bg-white border border-red-200 rounded-sm">
          <p className="text-red-600 text-center font-medium">
            No formatted transcript content available to display
          </p>
          <div className="mt-4 p-4 bg-slate-50 border rounded text-xs font-mono text-slate-700">
            <div><strong>Debug:</strong> Empty formatted text received</div>
            <div>Type: {typeof formattedText}</div>
            <div>undefined: {String(formattedText === undefined)}</div>
            <div>null: {String(formattedText === null)}</div>
            <div>empty string: {String(formattedText === '')}</div>
            <div>length before trim: {formattedText?.length || 0}</div>
            <div>length after trim: {formattedText?.trim()?.length || 0}</div>
          </div>
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

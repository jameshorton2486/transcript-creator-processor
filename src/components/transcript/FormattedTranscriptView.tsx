
import React from 'react';

interface FormattedTranscriptViewProps {
  formattedText: string;
}

export const FormattedTranscriptView: React.FC<FormattedTranscriptViewProps> = ({
  formattedText
}) => {
  if (!formattedText) {
    return (
      <div className="p-4 text-muted-foreground text-center">
        No transcript content to display
      </div>
    );
  }
  
  return (
    <div className="p-4 whitespace-pre-wrap font-sans text-sm">
      <div dangerouslySetInnerHTML={{ __html: formattedText }} />
    </div>
  );
};


import React from 'react';

export const ApiKeyInfoFooter: React.FC = () => {
  return (
    <div className="flex items-center justify-between text-xs text-slate-500 border-t pt-2 mt-2">
      <span>Need a Deepgram API key?</span>
      <a 
        href="https://console.deepgram.com/signup" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        Get one from Deepgram
      </a>
    </div>
  );
};

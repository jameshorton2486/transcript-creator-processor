
import React from 'react';
import { Link } from 'react-router-dom';
import DeepgramTranscriber from '@/components/DeepgramTranscriber';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const DeepgramTest = () => {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link to="/">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Document Analysis
          </Button>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Deepgram Transcription</h1>
      <DeepgramTranscriber />
    </div>
  );
};

export default DeepgramTest;

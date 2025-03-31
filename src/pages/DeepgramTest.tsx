
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DeepgramTranscriber from '@/components/DeepgramTranscriber';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DeepgramTranscriptionOptions } from '@/components/deepgram/DeepgramTranscriptionOptions';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ExtractedTermsEditor } from '@/components/document/ExtractedTermsEditor';

// The default options in case none were saved
const DEFAULT_OPTIONS = {
  model: "nova-2",
  punctuate: true,
  smart_format: true,
  diarize: false,
  detect_language: false,
  profanity_filter: false,
  paragraphs: false,
  utterances: false,
  filler_words: false,
  summarize: false,
  topics: false,
  intents: false,
  detect_entities: false,
  sentiment: false,
  keyterm: [],
  replace: []
};

const DeepgramTest = () => {
  const [transcriptionOptions, setTranscriptionOptions] = useState(DEFAULT_OPTIONS);
  const [extractedTerms, setExtractedTerms] = useState<string[]>([]);
  
  // Load any saved options and terms from session storage
  useEffect(() => {
    try {
      const savedOptions = sessionStorage.getItem('deepgramOptions');
      if (savedOptions) {
        setTranscriptionOptions(JSON.parse(savedOptions));
      }
      
      const savedTerms = sessionStorage.getItem('extractedTerms');
      if (savedTerms) {
        setExtractedTerms(JSON.parse(savedTerms));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);
  
  const handleOptionsChange = (name: string, value: any) => {
    const updatedOptions = {
      ...transcriptionOptions,
      [name]: value
    };
    setTranscriptionOptions(updatedOptions);
    
    // Save to session storage for persistence
    try {
      sessionStorage.setItem('deepgramOptions', JSON.stringify(updatedOptions));
    } catch (error) {
      console.error('Error saving transcription options:', error);
    }
  };

  const handleTermsUpdate = (updatedTerms: string[]) => {
    setExtractedTerms(updatedTerms);
    
    // Update keyterm option with the new terms
    handleOptionsChange('keyterm', updatedTerms);
    
    // Save to session storage for persistence
    try {
      sessionStorage.setItem('extractedTerms', JSON.stringify(updatedTerms));
    } catch (error) {
      console.error('Error saving extracted terms:', error);
    }
  };

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
      
      {extractedTerms.length > 0 && (
        <ExtractedTermsEditor 
          terms={extractedTerms} 
          onTermsUpdate={handleTermsUpdate} 
        />
      )}
      
      <Card className="p-6 my-6">
        <h2 className="text-xl font-semibold mb-2">Transcription Settings</h2>
        <p className="text-sm text-slate-500 mb-4">
          Customize how Deepgram processes your audio files
        </p>
        <Separator className="my-4" />
        <DeepgramTranscriptionOptions 
          onOptionsChange={handleOptionsChange}
          initialOptions={transcriptionOptions}
        />
      </Card>
      
      <DeepgramTranscriber />
    </div>
  );
};

export default DeepgramTest;

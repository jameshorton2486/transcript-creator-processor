
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DeepgramTranscriber from '@/components/DeepgramTranscriber';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { DeepgramTranscriptionOptions } from '@/components/deepgram/DeepgramTranscriptionOptions';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ExtractedTermsEditor } from '@/components/document/ExtractedTermsEditor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FindAndReplaceEditor } from '@/components/deepgram/FindAndReplaceEditor';

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
  const [findReplaceEntries, setFindReplaceEntries] = useState<Array<{find: string; replace: string}>>([]);
  const [proxyServerAvailable, setProxyServerAvailable] = useState<boolean | null>(null);
  const [showServerAlert, setShowServerAlert] = useState(true);
  
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

      const savedFindReplace = sessionStorage.getItem('findReplaceEntries');
      if (savedFindReplace) {
        setFindReplaceEntries(JSON.parse(savedFindReplace));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Check if proxy server is available
  useEffect(() => {
    const checkProxyServer = async () => {
      try {
        const response = await fetch('http://localhost:4000/check-status', { 
          method: 'GET',
          signal: AbortSignal.timeout(3000) // Timeout after 3 seconds
        });
        setProxyServerAvailable(response.ok);
      } catch (error) {
        console.log('Proxy server check failed:', error);
        setProxyServerAvailable(false);
      }
    };

    checkProxyServer();
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

  const handleFindReplaceUpdate = (entries: Array<{find: string; replace: string}>) => {
    setFindReplaceEntries(entries);
    
    // Update replace option with the new entries
    handleOptionsChange('replace', entries);
    
    // Save to session storage for persistence
    try {
      sessionStorage.setItem('findReplaceEntries', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving find & replace entries:', error);
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
      
      {showServerAlert && (
        <Alert variant={proxyServerAvailable === false ? "destructive" : "default"} className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {proxyServerAvailable === null 
              ? "Checking proxy server status..." 
              : proxyServerAvailable 
                ? "Proxy server is running" 
                : "Proxy server is not running"}
          </AlertTitle>
          <AlertDescription>
            {proxyServerAvailable === null ? (
              "Checking if the proxy server is available..."
            ) : proxyServerAvailable ? (
              "The proxy server is running correctly. CORS issues will be avoided."
            ) : (
              <div className="space-y-2">
                <p>
                  The proxy server at localhost:4000 is not running. You may encounter CORS errors when 
                  using Deepgram services.
                </p>
                <p>
                  To fix this, start the Express proxy server from the <code className="bg-slate-100 px-1 rounded">server/</code> directory 
                  by running <code className="bg-slate-100 px-1 rounded">node server.js</code>. 
                  See <code className="bg-slate-100 px-1 rounded">server/README.md</code> for more details.
                </p>
              </div>
            )}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowServerAlert(false)}
            className="absolute top-2 right-2"
          >
            Dismiss
          </Button>
        </Alert>
      )}
      
      {extractedTerms.length > 0 && (
        <ExtractedTermsEditor 
          terms={extractedTerms} 
          onTermsUpdate={handleTermsUpdate} 
        />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <Card className="p-6">
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
        
        <Card>
          <CardContent className="p-6">
            <FindAndReplaceEditor
              initialEntries={findReplaceEntries}
              onEntriesChange={handleFindReplaceUpdate}
              disabled={false}
            />
          </CardContent>
        </Card>
      </div>
      
      <DeepgramTranscriber />
    </div>
  );
};

export default DeepgramTest;

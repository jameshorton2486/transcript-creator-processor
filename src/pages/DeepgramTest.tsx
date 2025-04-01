
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DeepgramTranscriber from '@/components/DeepgramTranscriber';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, FileAudio } from 'lucide-react';
import { DeepgramTranscriptionOptions } from '@/components/deepgram/DeepgramTranscriptionOptions';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ExtractedTermsEditor } from '@/components/document/ExtractedTermsEditor';
import { FindAndReplaceEditor } from '@/components/deepgram/FindAndReplaceEditor';
import { useToast } from '@/hooks/use-toast';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

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
  const { toast } = useToast();
  const [transcriptionOptions, setTranscriptionOptions] = useState(DEFAULT_OPTIONS);
  const [extractedTerms, setExtractedTerms] = useState<string[]>([]);
  const [findReplaceEntries, setFindReplaceEntries] = useState<Array<{find: string; replace: string}>>([]);
  const [proxyServerAvailable, setProxyServerAvailable] = useState<boolean | null>(null);
  const [proxyTestInProgress, setProxyTestInProgress] = useState(false);
  
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

  useEffect(() => {
    const checkProxyServer = async () => {
      setProxyTestInProgress(true);
      try {
        const response = await fetch('http://localhost:4000/check-status', { 
          method: 'GET',
          signal: AbortSignal.timeout(3000) // Timeout after 3 seconds
        });
        setProxyServerAvailable(response.ok);
        
        if (response.ok) {
          toast({
            title: "Proxy Server Connected",
            description: "Successfully connected to the proxy server. CORS issues will be avoided.",
          });
        }
      } catch (error) {
        console.log('Proxy server check failed:', error);
        setProxyServerAvailable(false);
        
        toast({
          title: "Proxy Server Unavailable",
          description: "Could not connect to the proxy server. Direct API calls may encounter CORS issues.",
          variant: "destructive",
        });
      } finally {
        setProxyTestInProgress(false);
      }
    };

    checkProxyServer();
  }, [toast]);
  
  const handleOptionsChange = (name: string, value: any) => {
    const updatedOptions = {
      ...transcriptionOptions,
      [name]: value
    };
    setTranscriptionOptions(updatedOptions);
    
    try {
      sessionStorage.setItem('deepgramOptions', JSON.stringify(updatedOptions));
    } catch (error) {
      console.error('Error saving transcription options:', error);
    }
  };

  const handleTermsUpdate = (updatedTerms: string[]) => {
    setExtractedTerms(updatedTerms);
    
    handleOptionsChange('keyterm', updatedTerms);
    
    try {
      sessionStorage.setItem('extractedTerms', JSON.stringify(updatedTerms));
    } catch (error) {
      console.error('Error saving extracted terms:', error);
    }
  };

  const handleFindReplaceUpdate = (entries: Array<{find: string; replace: string}>) => {
    setFindReplaceEntries(entries);
    
    handleOptionsChange('replace', entries);
    
    try {
      sessionStorage.setItem('findReplaceEntries', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving find & replace entries:', error);
    }
  };

  const retryProxyCheck = () => {
    setProxyServerAvailable(null);
    
    const checkProxyServer = async () => {
      setProxyTestInProgress(true);
      try {
        const response = await fetch('http://localhost:4000/check-status', { 
          method: 'GET',
          signal: AbortSignal.timeout(3000) // Timeout after 3 seconds
        });
        setProxyServerAvailable(response.ok);
      } catch (error) {
        console.log('Proxy server check failed:', error);
        setProxyServerAvailable(false);
      } finally {
        setProxyTestInProgress(false);
      }
    };

    checkProxyServer();
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-6 space-y-4">
        <Link to="/">
          <Button variant="default" size="lg" className="flex items-center gap-2 shadow-sm">
            <ArrowLeft className="h-5 w-5" />
            Back to Document Analysis
          </Button>
        </Link>
        
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center">
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center">
                <FileAudio className="h-4 w-4 mr-1" />
                Deepgram Transcription
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Deepgram Audio Transcription</h1>
      
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

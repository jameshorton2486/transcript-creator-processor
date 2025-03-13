
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mic, FileAudio, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DEFAULT_TRANSCRIPTION_OPTIONS } from "@/lib/config";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AudioTranscriberProps {
  onTranscriptCreated: (transcript: string, jsonData: any) => void;
}

export const AudioTranscriber = ({ onTranscriptCreated }: AudioTranscriberProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState(DEFAULT_TRANSCRIPTION_OPTIONS);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setError(null);
      
      // Check if file is audio or video
      if (selectedFile.type.startsWith("audio/") || selectedFile.type.startsWith("video/")) {
        setFile(selectedFile);
        
        // Log file info
        console.log(`File selected: ${selectedFile.name} (${selectedFile.type}, ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        setError("Invalid file type. Please select an audio or video file.");
        toast({
          title: "Invalid file type",
          description: "Please select an audio or video file.",
          variant: "destructive",
        });
      }
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("audio/")) {
      return <Mic className="h-4 w-4" />;
    } else if (mimeType.includes("video/")) {
      return <FileAudio className="h-4 w-4" />;
    } else {
      return <FileAudio className="h-4 w-4" />;
    }
  };

  const transcribeAudio = async () => {
    if (!file) {
      setError("No file selected. Please select an audio or video file first.");
      toast({
        title: "No file selected",
        description: "Please select an audio or video file first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // In a real production app, we would upload to a server
      // For this demo, we'll simulate the API call
      console.log(`Transcribing file: ${file.name}`);
      console.log(`Transcription options:`, options);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));
      
      // Simulate API call with setTimeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Since we don't have a real backend connected yet, use mock data
      // In a real app, you would fetch from your backend API:
      // const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
      // const data = await response.json();
      
      // Mock response data
      const mockTranscript = `Speaker 1: Thank you for joining us today. We'll be discussing the case of Smith v. Jones.
Speaker 2: I'd like to present evidence regarding the contract signed on March 15, 2023.
Speaker 1: Please proceed with your argument.
Speaker 2: The defendant clearly violated section 3.4 of the agreement when they failed to provide the required services by April 30.`;
      
      // Build a realistic response object based on options
      const mockJsonData: any = {
        metadata: {
          transaction_key: "mock-transaction",
          request_id: "mock-request-id",
          sha256: "mock-sha256",
          created: new Date().toISOString(),
          duration: 65.92,
          channels: 1,
          models: ["general"],
          model_info: {
            general: {
              name: "general",
              version: "2023-05-18"
            }
          }
        },
        results: {
          channels: [{
            alternatives: [{
              transcript: mockTranscript,
              confidence: 0.98,
              words: [
                {
                  word: "Thank",
                  start: 0.01,
                  end: 0.25,
                  confidence: 0.99,
                  speaker: options.diarize ? 0 : null
                },
                // More words would go here in a real implementation
              ]
            }]
          }]
        }
      };
      
      // Add utterances if that option is enabled
      if (options.utterances) {
        mockJsonData.results.utterances = [
          {
            speaker: 0,
            start: 0.0,
            end: 5.2,
            confidence: 0.95,
            transcript: "Thank you for joining us today. We'll be discussing the case of Smith v. Jones."
          },
          {
            speaker: 1,
            start: 5.4,
            end: 10.3,
            confidence: 0.97,
            transcript: "I'd like to present evidence regarding the contract signed on March 15, 2023."
          }
        ];
      }
      
      onTranscriptCreated(mockTranscript, mockJsonData);
      
      toast({
        title: "Transcription complete",
        description: "The audio has been successfully transcribed.",
      });
    } catch (error) {
      console.error("Transcription error:", error);
      setError("Failed to transcribe file. Please try again or select a different file.");
      toast({
        title: "Transcription failed",
        description: "There was an error transcribing your audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <CardTitle>Audio Transcription</CardTitle>
        <CardDescription>Upload an audio file to create a transcript</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
          <FileAudio className="h-10 w-10 text-slate-400 mb-2" />
          <p className="text-sm text-slate-500 mb-2">Upload an audio or video file for transcription</p>
          <input
            type="file"
            id="audio-file"
            accept="audio/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="audio-file"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 cursor-pointer"
          >
            <Mic className="h-4 w-4" />
            Select Audio File
          </label>
          <p className="text-xs text-slate-400 mt-2">
            Supports MP3, WAV, FLAC, M4A and most audio/video formats
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {file && (
          <div className="p-3 bg-slate-50 rounded-md">
            <p className="text-sm font-medium text-slate-700 flex items-center">
              {getFileIcon(file.type)}
              <span className="ml-2">Selected file:</span>
            </p>
            <p className="text-sm text-slate-500 truncate">{file.name}</p>
            <p className="text-xs text-slate-400">
              {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-slate-400" />
              <Label htmlFor="diarize">Speaker Identification</Label>
            </div>
            <Switch
              id="diarize"
              checked={options.diarize}
              onCheckedChange={(checked) => 
                setOptions({...options, diarize: checked})
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-slate-400" />
              <Label htmlFor="punctuate">Automatic Punctuation</Label>
            </div>
            <Switch
              id="punctuate"
              checked={options.punctuate}
              onCheckedChange={(checked) => 
                setOptions({...options, punctuate: checked})
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-slate-400" />
              <Label htmlFor="paragraphs">Paragraph Detection</Label>
            </div>
            <Switch
              id="paragraphs"
              checked={options.paragraphs}
              onCheckedChange={(checked) => 
                setOptions({...options, paragraphs: checked})
              }
            />
          </div>
        </div>
        
        <Button 
          className="w-full" 
          onClick={transcribeAudio} 
          disabled={!file || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Transcribing...
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Transcribe Audio
            </>
          )}
        </Button>
      </CardContent>
      
      <CardFooter className="bg-slate-50 text-xs text-slate-500 italic">
        Transcription powered by Deepgram API. Processing may take a few minutes for larger files.
      </CardFooter>
    </Card>
  );
};

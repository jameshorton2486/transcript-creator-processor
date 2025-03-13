
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mic, FileAudio, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DEFAULT_TRANSCRIPTION_OPTIONS } from "@/lib/config";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { transcribeAudio, extractTranscriptText } from "@/lib/deepgramService";

interface AudioTranscriberProps {
  onTranscriptCreated: (transcript: string, jsonData: any) => void;
}

export const AudioTranscriber = ({ onTranscriptCreated }: AudioTranscriberProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState(DEFAULT_TRANSCRIPTION_OPTIONS);
  const [apiKey, setApiKey] = useState("");
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

  const transcribeAudioFile = async () => {
    if (!file) {
      setError("No file selected. Please select an audio or video file first.");
      toast({
        title: "No file selected",
        description: "Please select an audio or video file first.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      setError("Deepgram API key is required for transcription.");
      toast({
        title: "API Key Required",
        description: "Please enter your Deepgram API key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Call the Deepgram service to transcribe the audio
      const response = await transcribeAudio(file, apiKey, options);
      
      // Extract the transcript text
      const transcriptText = extractTranscriptText(response);
      
      onTranscriptCreated(transcriptText, response);
      
      toast({
        title: "Transcription complete",
        description: "The audio has been successfully transcribed.",
      });
    } catch (error) {
      console.error("Transcription error:", error);
      setError("Failed to transcribe file. Please check your API key and try again.");
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
        <div>
          <Label htmlFor="api-key">Deepgram API Key</Label>
          <Input 
            id="api-key"
            type="password" 
            placeholder="Enter your Deepgram API key" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-slate-500 mt-1">
            Your API key is required for transcription and is not stored permanently
          </p>
        </div>

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
          onClick={transcribeAudioFile} 
          disabled={!file || isLoading || !apiKey}
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

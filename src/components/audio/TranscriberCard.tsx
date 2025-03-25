
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TranscriberFooter } from "@/components/audio/TranscriberFooter";

interface TranscriberCardProps {
  children: React.ReactNode;
}

export const TranscriberCard = ({ children }: TranscriberCardProps) => {
  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <CardTitle>Audio Transcription</CardTitle>
        <CardDescription>Upload an audio file to create a transcript</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {children}
      </CardContent>
      
      <TranscriberFooter />
    </Card>
  );
};

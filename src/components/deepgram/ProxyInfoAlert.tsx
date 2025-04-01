
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Terminal, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator'; 

interface ProxyInfoAlertProps {
  showProxyInfo: boolean;
  setShowProxyInfo: (show: boolean) => void;
}

export const ProxyInfoAlert: React.FC<ProxyInfoAlertProps> = ({
  showProxyInfo,
  setShowProxyInfo
}) => {
  if (!showProxyInfo) return null;
  
  return (
    <Alert className="bg-amber-50 border-amber-200 text-amber-800 mb-6 relative">
      <Info className="h-4 w-4 text-amber-800" />
      <AlertDescription className="space-y-4 text-sm">
        <div className="font-medium text-base flex items-center gap-2 text-amber-900">
          <Terminal className="h-5 w-5" />
          Recommended: Use the Python GUI Application
        </div>
        
        <div className="bg-white p-4 rounded-md border border-amber-200 shadow-sm">
          <p className="font-medium mb-2">Simple & Standalone Solution:</p>
          <pre className="bg-amber-100 p-3 rounded text-sm mb-3 overflow-x-auto">
            cd transcript_processor_local<br/>
            python main.py
          </pre>
          <p className="text-amber-700">
            ✓ Runs completely locally<br/>
            ✓ No proxy server needed<br/>
            ✓ Avoids CORS issues entirely<br/>
            ✓ Easy graphical interface<br/>
          </p>
        </div>
        
        <Separator className="bg-amber-200" />
        
        <div>
          <p className="mb-2">
            <strong>Web Interface Alternative:</strong> If you prefer using this web interface, 
            you'll need to start the Express proxy server to handle Deepgram API requests and avoid CORS issues.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
            onClick={() => window.open("https://github.com/your-repo/transcript-processor/tree/main/server", "_blank")}
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Proxy Server Instructions
          </Button>
        </div>
      </AlertDescription>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-6 text-amber-800 hover:text-amber-900 hover:bg-amber-100 absolute right-2 top-2"
        onClick={() => setShowProxyInfo(false)}
      >
        Dismiss
      </Button>
    </Alert>
  );
};

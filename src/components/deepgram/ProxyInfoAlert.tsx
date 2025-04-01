
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

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
    <Alert className="bg-amber-50 border-amber-200 text-amber-800">
      <Info className="h-4 w-4 text-amber-800" />
      <AlertDescription className="space-y-2 text-sm">
        <p>
          For optimal web performance, ensure the Express proxy server is running. This handles 
          Deepgram API requests and avoids CORS issues.
        </p>
        <p className="font-semibold">
          Easier Alternative: Instead of using this web interface, use the Python script directly:
        </p>
        <pre className="bg-amber-100 p-2 rounded text-xs">
          cd transcript_processor_local<br/>
          python main.py
        </pre>
        <p>
          The Python script works without proxy servers and avoids CORS completely.
        </p>
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

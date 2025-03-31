
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
      <AlertDescription className="text-sm">
        For optimal performance, ensure the Express proxy server is running. This handles 
        Deepgram API requests and avoids CORS issues. Check server/README.md for instructions.
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

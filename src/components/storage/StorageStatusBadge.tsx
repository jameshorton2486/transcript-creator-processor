
import { useEffect, useState } from 'react';
import { Database, HardDrive, CloudOff, Cloud } from 'lucide-react';
import { initRemoteStorage } from '@/lib/storage/modelStorage';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const StorageStatusBadge = () => {
  const [storageStatus, setStorageStatus] = useState<{
    isRemoteAvailable: boolean;
    message: string;
    provider?: string;
  }>({
    isRemoteAvailable: false,
    message: 'Initializing storage...'
  });
  
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    const checkStorage = async () => {
      try {
        const status = await initRemoteStorage();
        setStorageStatus(status);
      } catch (error) {
        console.error("Error checking storage status:", error);
        setStorageStatus({
          isRemoteAvailable: false,
          message: 'Error: Using local storage only'
        });
      }
    };
    
    checkStorage();
  }, []);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={storageStatus.isRemoteAvailable ? "default" : "outline"} 
              className={`ml-auto flex items-center gap-1 cursor-pointer hover:bg-slate-100 ${
                storageStatus.isRemoteAvailable ? "bg-green-100 hover:bg-green-200 text-green-800" : ""
              }`}
              onClick={() => setConfigOpen(true)}
            >
              {storageStatus.isRemoteAvailable ? (
                <Cloud className="h-3 w-3" />
              ) : (
                <HardDrive className="h-3 w-3" />
              )}
              {storageStatus.isRemoteAvailable 
                ? `${storageStatus.provider || 'Cloud'} Storage` 
                : "Local Storage"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{storageStatus.message}</p>
            {!storageStatus.isRemoteAvailable && (
              <p className="text-xs mt-1">Click to configure cloud storage</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Storage Configuration</DialogTitle>
            <DialogDescription>
              Configure how your transcripts and training data are stored.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <h3 className="text-sm font-medium">Current Storage Mode</h3>
              <div className="flex items-center space-x-2 text-sm">
                {storageStatus.isRemoteAvailable ? (
                  <>
                    <Cloud className="h-4 w-4 text-green-600" />
                    <span>Connected to {storageStatus.provider || 'Cloud'} Storage</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="h-4 w-4 text-amber-600" />
                    <span>Using browser local storage only (data not synced)</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Connect to Cloud Storage</h3>
              <p className="text-sm text-slate-600 mb-4">
                To enable cloud storage and authentication, connect to one of these providers:
              </p>
              
              <div className="flex flex-col space-y-2">
                <Button variant="outline" className="justify-start">
                  <img src="https://supabase.com/favicon/favicon-32x32.png" className="w-4 h-4 mr-2" alt="Supabase" />
                  Connect to Supabase
                </Button>
                <Button variant="outline" className="justify-start">
                  <img src="https://www.gstatic.com/devrel-devsite/prod/vbf66214f2f7feed2e5d8db155bab9ace53c57c494418a1473b23972413e224a8/firebase/images/favicon.png" className="w-4 h-4 mr-2" alt="Firebase" />
                  Connect to Firebase
                </Button>
              </div>
              
              <p className="text-xs text-slate-500 mt-4">
                Connecting to a provider will allow you to save transcripts and training data to the cloud,
                enable user authentication, and access advanced features.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

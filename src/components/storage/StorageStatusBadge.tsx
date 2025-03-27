
import { useEffect, useState } from 'react';
import { Database, HardDrive } from 'lucide-react';
import { initRemoteStorage } from '@/lib/storage/modelStorage';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const StorageStatusBadge = () => {
  const [storageStatus, setStorageStatus] = useState<{
    isRemoteAvailable: boolean;
    message: string;
  }>({
    isRemoteAvailable: false,
    message: 'Initializing storage...'
  });

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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={storageStatus.isRemoteAvailable ? "default" : "outline"} className="ml-auto">
            {storageStatus.isRemoteAvailable ? (
              <Database className="h-3 w-3 mr-1" />
            ) : (
              <HardDrive className="h-3 w-3 mr-1" />
            )}
            {storageStatus.isRemoteAvailable ? "Cloud Storage" : "Local Storage"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{storageStatus.message}</p>
          {!storageStatus.isRemoteAvailable && (
            <p className="text-xs mt-1">To enable cloud storage, set up Supabase, Firebase, or another backend service.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

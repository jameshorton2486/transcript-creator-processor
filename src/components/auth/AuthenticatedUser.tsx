
import { useState } from 'react';
import { User, LockKeyhole, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from './AuthForm';
import { Badge } from '@/components/ui/badge';

export const AuthenticatedUser = () => {
  const { currentUser, loading, signOut, hasRole } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const handleOpenAuthDialog = () => {
    setAuthDialogOpen(true);
  };

  return (
    <>
      {currentUser ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.photoURL || ''} alt={currentUser.displayName || 'User'} />
                <AvatarFallback className="bg-indigo-600 text-white">
                  {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="flex items-center gap-2">
              <span>{currentUser.displayName || currentUser.email || 'User'}</span>
              {hasRole('admin') && (
                <Badge variant="outline" className="text-xs bg-indigo-100 text-indigo-800 border-indigo-200">
                  Admin
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Settings</DropdownMenuItem>
            <DropdownMenuItem disabled>Saved Transcripts</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={handleOpenAuthDialog}
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Sign In'}
          <User className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <AuthForm />
        </DialogContent>
      </Dialog>
    </>
  );
};

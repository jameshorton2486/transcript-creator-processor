
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AuthUser = {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  isAdmin?: boolean;
};

// This is a placeholder for the actual authentication state management
// that will be implemented with a real auth provider
const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    // This will be replaced with actual auth provider logic
    setTimeout(() => {
      setUser({
        id: 'user-123',
        email: 'demo@example.com',
        displayName: 'Demo User',
      });
      setLoading(false);
    }, 1500);
  };

  const signOut = async () => {
    setLoading(true);
    // This will be replaced with actual auth provider logic
    setTimeout(() => {
      setUser(null);
      setLoading(false);
    }, 800);
  };

  return {
    user,
    loading,
    signIn,
    signOut,
  };
};

export const AuthenticatedUser = () => {
  const { user, loading, signIn, signOut } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

  const handleOpenAuthDialog = () => {
    setAuthDialogOpen(true);
  };

  return (
    <>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                <AvatarFallback className="bg-indigo-600 text-white">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user.displayName || user.email || 'User'}
              {user.isAdmin && <span className="ml-2 text-xs text-indigo-600">(Admin)</span>}
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
          <DialogHeader>
            <DialogTitle>Authentication</DialogTitle>
            <DialogDescription>
              Sign in to save your transcripts and use cloud features
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="pt-4">
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Connect to a service to authenticate:</p>
                
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" className="justify-start" disabled={loading}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 mr-2" alt="Google" />
                    Sign in with Google
                  </Button>
                  <Button variant="outline" className="justify-start" disabled={loading}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/microsoft.svg" className="w-4 h-4 mr-2" alt="Microsoft" />
                    Sign in with Microsoft
                  </Button>
                </div>
                
                <p className="text-xs text-slate-500 mt-2">
                  * Authentication requires a connected cloud storage provider
                </p>
                
                <Button 
                  onClick={signIn} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Demo Sign In (Temporary)'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="signup" className="pt-4">
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Create a new account:</p>
                
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" className="justify-start" disabled={loading}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 mr-2" alt="Google" />
                    Sign up with Google
                  </Button>
                  <Button variant="outline" className="justify-start" disabled={loading}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/microsoft.svg" className="w-4 h-4 mr-2" alt="Microsoft" />
                    Sign up with Microsoft
                  </Button>
                </div>
                
                <p className="text-xs text-slate-500 mt-2">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

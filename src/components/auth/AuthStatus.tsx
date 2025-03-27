
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export const AuthStatus = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        Checking...
      </Badge>
    );
  }

  if (!currentUser) {
    return (
      <Badge variant="outline" className="text-xs">
        Not signed in
      </Badge>
    );
  }

  return (
    <Badge variant="success" className="text-xs">
      Signed in
    </Badge>
  );
};

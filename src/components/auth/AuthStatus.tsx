
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface AuthStatusProps {
  authenticated: boolean;
  emailVerified?: boolean;
}

/**
 * Component that displays the authentication status of the user
 */
const AuthStatus: React.FC<AuthStatusProps> = ({
  authenticated,
  emailVerified = false
}) => {
  if (!authenticated) {
    return (
      <Badge variant="destructive">
        Not Authenticated
      </Badge>
    );
  }

  if (!emailVerified) {
    return (
      <Badge variant="outline">
        Email Not Verified
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
      Authenticated
    </Badge>
  );
};

export default AuthStatus;

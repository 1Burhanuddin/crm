import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './useSession';
import { toast } from './use-toast';

export function useAuthRedirect() {
  const { status, user } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'signed_out' || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to continue.",
        variant: "destructive"
      });
      navigate('/auth');
    }
  }, [status, user, navigate]);

  return { status, user };
} 
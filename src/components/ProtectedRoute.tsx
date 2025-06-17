import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/hooks/useSession";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, status } = useSession();
  const location = useLocation();

  // If still loading, show nothing
  if (status === "loading") {
    return null;
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    // Save the attempted URL to redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
} 
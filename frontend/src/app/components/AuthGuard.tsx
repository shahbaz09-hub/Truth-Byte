import { useEffect } from "react";
import { useNavigate } from "react-router";
import { isAuthenticated, clearExpiredSession } from "../services/api";

/**
 * AuthGuard — wraps protected pages.
 * If user has no valid (non-expired) token, redirects to /login.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any expired session first
    clearExpiredSession();

    if (!isAuthenticated()) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // If not authenticated, render nothing while redirect happens
  if (!isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}

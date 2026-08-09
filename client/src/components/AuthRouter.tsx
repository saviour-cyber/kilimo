/**
 * AuthRouter — Centralized post-authentication routing logic.
 *
 * Decision tree:
 *   1. Not authenticated → /login
 *   2. role === 'admin'  → /admin  (Platform Admin context — never sees farm UI)
 *   3. Has farms         → /dashboard  (Farm Operations context)
 *   4. No farms          → /dashboard  (Welcome screen which prompts to create first farm)
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface AuthRouterProps {
  /** Fallback UI while the auth/farm queries are loading */
  children?: React.ReactNode;
}

export function useAuthRedirect() {
  const { user, isPlatformAdmin, loading } = useAuth();
  const [, navigate] = useLocation();

  // Only fetch farms for non-admin tenant users
  const { data: farms = [], isLoading: farmsLoading } = trpc.farms.list.useQuery(undefined, {
    enabled: !loading && !!user && !isPlatformAdmin,
    retry: false,
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (isPlatformAdmin) {
      navigate("/admin");
      return;
    }
    if (farmsLoading) return;
    
    // Always navigate to dashboard to allow KilimoLayout to render the Welcome screen for 0 farms
    navigate("/dashboard");
  }, [loading, user, isPlatformAdmin, farmsLoading, navigate]);

  return { loading: loading || (!isPlatformAdmin && !!user && farmsLoading) };
}

/**
 * Resolves the correct redirect path synchronously from user data.
 * Use this in login handlers to redirect immediately after login.
 */
export function resolvePostLoginPath(role: string | null | undefined): string {
  if (role === "admin") return "/admin";
  return "/dashboard"; // Farm check will happen inside KilimoLayout if needed
}

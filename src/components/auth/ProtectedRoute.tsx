import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useEffect } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const { status, isLoading: subscriptionLoading } = useSubscription();

  // Debugging auth state
  useEffect(() => {
    console.log('[ProtectedRoute] Estado Auth:', {
      temSessao: !!session,
      carregando: loading,
      caminho: window.location.pathname
    });
  }, [session, loading]);

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (status === 'expired' && location.pathname !== '/planos') {
    return <Navigate to="/planos" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

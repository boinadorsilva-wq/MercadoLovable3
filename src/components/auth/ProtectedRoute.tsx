import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useEffect, useState } from "react";
import { useTrial } from "@/hooks/useTrial";
import { useToast } from "@/hooks/use-toast";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const { status, isLoading: subscriptionLoading } = useSubscription();

  const { timeLeft, isExpired } = useTrial();
  const { toast } = useToast();
  const [hasNotified, setHasNotified] = useState(false);

  // Debugging auth state
  useEffect(() => {
    console.log('[ProtectedRoute] Estado Auth:', {
      temSessao: !!session,
      carregando: loading,
      caminho: window.location.pathname,
      tempoRestanteTrial: timeLeft,
      trialExpirado: isExpired
    });
  }, [session, loading, timeLeft, isExpired]);

  // Notify user about trial
  useEffect(() => {
    if (session && !subscriptionLoading && status !== 'active' && timeLeft !== null && timeLeft > 0 && !hasNotified) {
      toast({
        title: "Período de Teste",
        description: `Você tem ${timeLeft} segundos de acesso gratuito para testar o sistema.`,
        duration: 5000,
      });
      setHasNotified(true);
    }
  }, [session, subscriptionLoading, status, timeLeft, hasNotified, toast]);

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

  // Se não tem assinatura ativa E o trial expirou, redireciona para planos
  // Exceto se já estiver na página de planos
  if (status !== 'active' && isExpired && location.pathname !== '/planos') {
    return <Navigate to="/planos" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

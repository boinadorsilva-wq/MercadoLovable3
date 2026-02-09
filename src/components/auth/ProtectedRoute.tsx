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
      subscriptionStatus: status, // Log adicionado para depuração
      tempoRestanteTrial: timeLeft,
      trialExpirado: isExpired
    });
  }, [session, loading, status, timeLeft, isExpired]);

  // Notify user about trial - APENAS para quem NÃO tem assinatura (status === 'none')
  useEffect(() => {
    if (session && !subscriptionLoading && status === 'none' && timeLeft !== null && timeLeft > 0 && !hasNotified) {
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

  // Se já estiver na página de planos, permite acesso para escolher um plano
  if (location.pathname === '/planos') {
    return <>{children}</>;
  }

  // 1. Bloqueio para Assinatura Expirada (Prioridade Alta - sem trial)
  if (status === 'expired') {
    return <Navigate to="/planos" replace />;
  }

  // 2. Bloqueio para Usuários Sem Assinatura que Esgotaram o Trial
  if (status === 'none' && isExpired) {
    return <Navigate to="/planos" replace />;
  }

  // Se status === 'active', passa direto.
  // Se status === 'none' e !isExpired, passa direto (período de teste).

  return <>{children}</>;
};

export default ProtectedRoute;

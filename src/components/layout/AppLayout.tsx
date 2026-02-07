import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useSubscription } from '@/hooks/useSubscription';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        <SubscriptionBanner />
        <div className="min-h-screen p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function SubscriptionBanner() {
  const { daysRemaining, status, isLoading } = useSubscription();
  const navigate = useNavigate();

  if (isLoading || status !== 'active' || daysRemaining === null || daysRemaining > 7) return null;

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Sua assinatura expira em {daysRemaining} dias. Renove agora para evitar bloqueio.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-yellow-500/50 text-yellow-700 hover:bg-yellow-500/10 hover:text-yellow-800 dark:text-yellow-200"
          onClick={() => navigate('/planos')}
        >
          Renovar Agora
        </Button>
      </div>
    </div>
  );
}

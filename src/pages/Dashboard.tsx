import { AppLayout } from '@/components/layout/AppLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { TopProductsCard } from '@/components/dashboard/TopProductsCard';
import { AlertsCard } from '@/components/dashboard/AlertsCard';
import { useDashboardMetrics, useMonthlySalesChart } from '@/hooks/useDashboard';
import { useTopProducts } from '@/hooks/useSales';
import { useLowStockProducts, useExpiringProducts } from '@/hooks/useProducts';
import { formatCurrency, formatPercent } from '@/lib/format';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  Clock,
  Receipt,
  Target,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: chartData, isLoading: chartLoading } = useMonthlySalesChart();
  const { data: topProducts, isLoading: topLoading } = useTopProducts(5);
  const { data: lowStockProducts } = useLowStockProducts();
  const { data: expiringProducts } = useExpiringProducts();

  // Payment Success Handling
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('payment_success') === 'true') {
      setShowSuccessDialog(true);
      // Clean URL
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Visão geral do desempenho do seu negócio
          </p>
        </div>

        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl flex flex-col items-center gap-2">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                Pagamento Confirmado!
              </DialogTitle>
              <DialogDescription className="text-center">
                Parabéns! Você acaba de receber acesso liberado ao Mercado PRO.
                Aproveite todos os recursos para gerenciar seu negócio.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center pt-4">
              <Button onClick={() => setShowSuccessDialog(false)} className="w-full">
                Começar a Usar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metricsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <MetricCard
                title="Receita do Mês"
                value={formatCurrency(metrics?.totalRevenue || 0)}
                icon={DollarSign}
                variant="primary"
              />
              <MetricCard
                title="Lucro Líquido"
                value={formatCurrency(metrics?.totalProfit || 0)}
                subtitle={`Margem: ${formatPercent(metrics?.profitMargin || 0)}`}
                icon={TrendingUp}
                variant="success"
              />
              <MetricCard
                title="Produtos Vendidos"
                value={String(metrics?.totalProductsSold || 0)}
                subtitle={`Ticket médio: ${formatCurrency(metrics?.averageTicket || 0)}`}
                icon={ShoppingCart}
                variant="info"
              />
              <MetricCard
                title="Despesas"
                value={formatCurrency(metrics?.totalExpenses || 0)}
                icon={Receipt}
                variant="warning"
              />
            </>
          )}
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metricsLoading ? (
            <>
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <div className="metric-card-warning flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {metrics?.lowStockProducts || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Produtos com estoque baixo
                  </p>
                </div>
              </div>
              <div className="metric-card-info flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                  <Clock className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {metrics?.expiringProducts || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Produtos próximos do vencimento
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Charts and Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {chartLoading ? (
              <Skeleton className="h-[350px] rounded-xl" />
            ) : (
              <RevenueChart data={chartData || []} />
            )}
          </div>
          <div>
            {topLoading ? (
              <Skeleton className="h-[350px] rounded-xl" />
            ) : (
              <TopProductsCard products={topProducts || []} />
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AlertsCard
            lowStockProducts={lowStockProducts || []}
            expiringProducts={expiringProducts || []}
          />
          <div className="metric-card flex flex-col items-center justify-center py-8">
            <Target className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Dica do Dia
            </h3>
            <p className="text-center text-muted-foreground max-w-sm">
              Cadastre seus produtos e registre vendas para ver análises detalhadas
              do seu negócio aqui no dashboard.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

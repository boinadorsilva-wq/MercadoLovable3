import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { SalesTable } from '@/components/sales/SalesTable';
import { SaleFormDialog } from '@/components/sales/SaleFormDialog';
import { useMonthlySales } from '@/hooks/useSales';
import { formatCurrency } from '@/lib/format';
import { Plus, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Vendas() {
  const [formOpen, setFormOpen] = useState(false);
  const { data: sales, isLoading } = useMonthlySales();

  const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.total_price), 0) || 0;
  const totalProfit = sales?.reduce((sum, sale) => sum + Number(sale.profit), 0) || 0;
  const totalItems = sales?.reduce((sum, sale) => sum + sale.quantity, 0) || 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Vendas
            </h1>
            <p className="mt-1 text-muted-foreground">
              Registre e acompanhe as vendas do mês
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Venda
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="metric-card-primary flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-sm text-muted-foreground">Receita do mês</p>
            </div>
          </div>
          <div className="metric-card-success flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totalProfit)}
              </p>
              <p className="text-sm text-muted-foreground">Lucro do mês</p>
            </div>
          </div>
          <div className="metric-card-info flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
              <ShoppingCart className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Itens vendidos</p>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        ) : (
          <SalesTable sales={sales || []} />
        )}
      </div>

      <SaleFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </AppLayout>
  );
}

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SalesTable } from '@/components/sales/SalesTable';
import { SaleFormDialog } from '@/components/sales/SaleFormDialog';
import { useMonthlySales, useCreateSale } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/format';
import { Plus, ShoppingCart, TrendingUp, DollarSign, Search, Zap, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Vendas() {
  const [formOpen, setFormOpen] = useState(false);
  const [quickSaleInput, setQuickSaleInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: sales, isLoading } = useMonthlySales();
  const { data: products } = useProducts();
  const createSale = useCreateSale();

  const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.total_price), 0) || 0;
  const totalProfit = sales?.reduce((sum, sale) => sum + Number(sale.profit), 0) || 0;
  const totalItems = sales?.reduce((sum, sale) => sum + sale.quantity, 0) || 0;

  const handleQuickSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSaleInput.trim()) return;

    setIsProcessing(true);
    try {
      // Parse input: "Product Name - Quantity" or just "Product Name" (default qty 1)
      const parts = quickSaleInput.split('-').map(p => p.trim());
      const nameQuery = parts[0].toLowerCase();
      const quantity = parts[1] ? parseInt(parts[1]) : 1;

      if (!nameQuery) throw new Error('Nome do produto inválido');
      if (isNaN(quantity) || quantity <= 0) throw new Error('Quantidade inválida');

      // Find product
      const product = products?.find(p => p.name.toLowerCase().includes(nameQuery));

      if (!product) {
        toast.error('Produto não encontrado. Verifique o nome.');
        setIsProcessing(false);
        return;
      }

      // Check for ambiguity if needed, but for now take the first match
      // Ideally show a list if multiple, but "Quick Sale" implies speed.

      await createSale.mutateAsync({
        productId: product.id,
        quantity: quantity
      });

      setQuickSaleInput('');
      toast.success(`Venda de ${quantity}x ${product.name} registrada!`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

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

        {/* Quick Sale Input */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Venda Rápida com IA</h3>
              <p className="text-sm text-muted-foreground">Digite o nome do produto e a quantidade. Ex: "Leite - 2"</p>
            </div>
          </div>
          <form onSubmit={handleQuickSale} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={quickSaleInput}
              onChange={(e) => setQuickSaleInput(e.target.value)}
              placeholder="Digite aqui... (Ex: Coca Cola - 3)"
              className="pl-12 h-14 text-lg rounded-xl transition-all border-border focus:border-primary focus:ring-4 focus:ring-primary/10"
              disabled={isProcessing}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-2 h-10 w-10 rounded-lg"
              disabled={isProcessing || !quickSaleInput}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </form>
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

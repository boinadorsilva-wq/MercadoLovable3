import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { formatCurrency, formatDate } from '@/lib/format';
import { categoryLabels, Product } from '@/types/database';
import { Search as SearchIcon, Package, TrendingUp, DollarSign, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Buscar() {
  const [search, setSearch] = useState('');
  const { data: products } = useProducts();
  const { data: sales } = useSales();

  const filteredProducts = search.length >= 2
    ? products?.filter(
        (product) =>
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          categoryLabels[product.category].toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const getProductStats = (product: Product) => {
    const productSales = sales?.filter((sale) => sale.product_id === product.id) || [];
    const totalSold = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalProfit = productSales.reduce((sum, sale) => sum + Number(sale.profit), 0);
    const margin = ((product.sale_price - product.cost_price) / product.cost_price) * 100;

    return { totalSold, totalProfit, margin };
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Busca Inteligente
          </h1>
          <p className="mt-1 text-muted-foreground">
            Pesquise produtos e veja estatísticas detalhadas
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Digite o nome do produto ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 text-lg"
          />
        </div>

        {/* Results */}
        {search.length < 2 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <SearchIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Comece a digitar para buscar
            </h3>
            <p className="text-muted-foreground">
              Digite pelo menos 2 caracteres para ver os resultados
            </p>
          </div>
        ) : filteredProducts?.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-muted-foreground">
              Tente buscar por outro termo
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredProducts?.map((product) => {
              const stats = getProductStats(product);
              const isLowStock = product.stock_quantity <= product.min_stock;

              return (
                <div
                  key={product.id}
                  className="rounded-xl border border-border bg-card p-6 space-y-4 hover:shadow-soft transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {categoryLabels[product.category]}
                      </p>
                    </div>
                    <span className="badge-info">{categoryLabels[product.category]}</span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Box className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Em Estoque</p>
                        <p
                          className={cn(
                            'text-lg font-semibold',
                            isLowStock ? 'text-warning' : 'text-foreground'
                          )}
                        >
                          {product.stock_quantity} un
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <TrendingUp className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total Vendido</p>
                        <p className="text-lg font-semibold text-foreground">
                          {stats.totalSold} un
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5">
                      <DollarSign className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-xs text-muted-foreground">Lucro Gerado</p>
                        <p className="text-lg font-semibold text-success">
                          {formatCurrency(stats.totalProfit)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Margem</p>
                        <p className="text-lg font-semibold text-primary">
                          {stats.margin.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Preço de Custo</p>
                      <p className="text-lg font-medium text-foreground">
                        {formatCurrency(product.cost_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Preço de Venda</p>
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(product.sale_price)}
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Entrada: {formatDate(product.entry_date)}</span>
                    {product.expiry_date && (
                      <span>Validade: {formatDate(product.expiry_date)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

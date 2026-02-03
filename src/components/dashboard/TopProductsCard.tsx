import { formatCurrency } from '@/lib/format';
import { TrendingUp } from 'lucide-react';

interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  profit: number;
}

interface TopProductsCardProps {
  products: TopProduct[];
}

export function TopProductsCard({ products }: TopProductsCardProps) {
  const maxProfit = Math.max(...products.map((p) => p.profit), 1);

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">
          Top 5 Produtos Mais Lucrativos
        </h3>
        <TrendingUp className="h-5 w-5 text-success" />
      </div>
      <div className="space-y-4">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma venda registrada ainda
          </p>
        ) : (
          products.map((product, index) => (
            <div key={product.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                    {product.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-success">
                    {formatCurrency(product.profit)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.quantity} vendidos
                  </p>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full gradient-success transition-all duration-500"
                  style={{ width: `${(product.profit / maxProfit) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

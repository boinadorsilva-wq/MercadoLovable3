import { AlertTriangle, Clock } from 'lucide-react';
import { Product } from '@/types/database';
import { formatDate, getDaysUntilExpiry } from '@/lib/format';
import { cn } from '@/lib/utils';

interface AlertsCardProps {
  lowStockProducts: Product[];
  expiringProducts: Product[];
}

export function AlertsCard({ lowStockProducts, expiringProducts }: AlertsCardProps) {
  const hasAlerts = lowStockProducts.length > 0 || expiringProducts.length > 0;

  return (
    <div className="metric-card-warning">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Alertas</h3>
        <AlertTriangle className="h-5 w-5 text-warning" />
      </div>

      {!hasAlerts ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum alerta no momento ✓
        </p>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {lowStockProducts.slice(0, 3).map((product) => (
            <div
              key={product.id}
              className="flex items-start gap-3 rounded-lg bg-destructive/5 p-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {product.name}
                </p>
                <p className="text-xs text-destructive">
                  Estoque baixo: {product.stock_quantity} unidades
                </p>
              </div>
            </div>
          ))}

          {expiringProducts.slice(0, 3).map((product) => {
            const daysUntil = getDaysUntilExpiry(product.expiry_date!);
            const isExpired = daysUntil < 0;

            return (
              <div
                key={product.id}
                className={cn(
                  'flex items-start gap-3 rounded-lg p-3',
                  isExpired ? 'bg-destructive/5' : 'bg-warning/5'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    isExpired ? 'bg-destructive/10' : 'bg-warning/10'
                  )}
                >
                  <Clock
                    className={cn(
                      'h-4 w-4',
                      isExpired ? 'text-destructive' : 'text-warning'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {product.name}
                  </p>
                  <p
                    className={cn(
                      'text-xs',
                      isExpired ? 'text-destructive' : 'text-warning'
                    )}
                  >
                    {isExpired
                      ? `Vencido há ${Math.abs(daysUntil)} dias`
                      : `Vence em ${daysUntil} dias (${formatDate(product.expiry_date!)})`}
                  </p>
                </div>
              </div>
            );
          })}

          {(lowStockProducts.length > 3 || expiringProducts.length > 3) && (
            <p className="text-xs text-muted-foreground text-center">
              Veja todos os alertas na página de Alertas
            </p>
          )}
        </div>
      )}
    </div>
  );
}

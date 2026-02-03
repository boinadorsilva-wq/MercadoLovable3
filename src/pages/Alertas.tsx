import { AppLayout } from '@/components/layout/AppLayout';
import { useLowStockProducts, useExpiringProducts } from '@/hooks/useProducts';
import { formatDate, formatCurrency, getDaysUntilExpiry } from '@/lib/format';
import { categoryLabels } from '@/types/database';
import { AlertTriangle, Clock, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function Alertas() {
  const { data: lowStockProducts, isLoading: lowStockLoading } = useLowStockProducts();
  const { data: expiringProducts, isLoading: expiringLoading } = useExpiringProducts();

  const isLoading = lowStockLoading || expiringLoading;

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Alertas
          </h1>
          <p className="mt-1 text-muted-foreground">
            Produtos que precisam de atenção
          </p>
        </div>

        {/* Low Stock Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <Package className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Estoque Baixo
              </h2>
              <p className="text-sm text-muted-foreground">
                Produtos abaixo do estoque mínimo
              </p>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : lowStockProducts?.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Package className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-foreground font-medium">
                Todos os produtos estão com estoque adequado!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lowStockProducts?.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {categoryLabels[product.category]}
                      </p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Em estoque:</span>
                    <span className="font-semibold text-warning">
                      {product.stock_quantity} unidades
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mínimo:</span>
                    <span className="text-foreground">{product.min_stock} unidades</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Repor:</span>
                    <span className="font-semibold text-primary">
                      {Math.max(0, product.min_stock * 2 - product.stock_quantity)} unidades
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Products Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
              <Clock className="h-5 w-5 text-info" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Próximos do Vencimento
              </h2>
              <p className="text-sm text-muted-foreground">
                Produtos que vencem nos próximos 30 dias
              </p>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : expiringProducts?.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Clock className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-foreground font-medium">
                Nenhum produto próximo do vencimento!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expiringProducts?.map((product) => {
                const daysUntil = getDaysUntilExpiry(product.expiry_date!);
                const isExpired = daysUntil < 0;
                const isUrgent = daysUntil <= 7;

                return (
                  <div
                    key={product.id}
                    className={cn(
                      'rounded-xl border p-4 space-y-3',
                      isExpired
                        ? 'border-destructive/30 bg-destructive/5'
                        : isUrgent
                        ? 'border-warning/30 bg-warning/5'
                        : 'border-info/30 bg-info/5'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {categoryLabels[product.category]}
                        </p>
                      </div>
                      <Clock
                        className={cn(
                          'h-5 w-5 flex-shrink-0',
                          isExpired
                            ? 'text-destructive'
                            : isUrgent
                            ? 'text-warning'
                            : 'text-info'
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Validade:</span>
                      <span
                        className={cn(
                          'font-semibold',
                          isExpired
                            ? 'text-destructive'
                            : isUrgent
                            ? 'text-warning'
                            : 'text-info'
                        )}
                      >
                        {formatDate(product.expiry_date!)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span
                        className={cn(
                          'font-semibold',
                          isExpired
                            ? 'text-destructive'
                            : isUrgent
                            ? 'text-warning'
                            : 'text-info'
                        )}
                      >
                        {isExpired
                          ? `Vencido há ${Math.abs(daysUntil)} dias`
                          : `${daysUntil} dias restantes`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Em estoque:</span>
                      <span className="text-foreground">
                        {product.stock_quantity} un × {formatCurrency(product.sale_price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/produtos">
              Gerenciar Produtos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

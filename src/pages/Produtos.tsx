import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/database';
import { Plus, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Produtos() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const { data: products, isLoading } = useProducts();

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingProduct(undefined);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Produtos
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie o catálogo de produtos do seu estabelecimento
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="metric-card flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {products?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total de produtos</p>
            </div>
          </div>
          <div className="metric-card-warning flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
              <Package className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {products?.filter((p) => p.stock_quantity <= p.min_stock).length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Estoque baixo</p>
            </div>
          </div>
          <div className="metric-card-success flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <Package className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {products?.filter((p) => p.stock_quantity > p.min_stock).length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Em estoque</p>
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
          <ProductsTable products={products || []} onEdit={handleEdit} />
        )}
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={handleCloseForm}
        product={editingProduct}
      />
    </AppLayout>
  );
}

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react';
import { Product, categoryLabels } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/format';
import { useDeleteProduct } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
}

export function ProductsTable({ products, onEdit }: ProductsTableProps) {
  const [search, setSearch] = useState('');
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const deleteProductMutation = useDeleteProduct();

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      categoryLabels[product.category].toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (deleteProduct) {
      await deleteProductMutation.mutateAsync(deleteProduct.id);
      setDeleteProduct(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Venda</TableHead>
              <TableHead className="text-right">Margem</TableHead>
              <TableHead className="text-center">Estoque</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const margin = ((product.sale_price - product.cost_price) / product.cost_price) * 100;
                const isLowStock = product.stock_quantity <= product.min_stock;

                return (
                  <TableRow key={product.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <span className="badge-info">
                        {categoryLabels[product.category]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.cost_price)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.sale_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'font-medium',
                          margin >= 30 ? 'text-success' : margin >= 15 ? 'text-warning' : 'text-destructive'
                        )}
                      >
                        {margin.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                        <span
                          className={cn(
                            'font-medium',
                            isLowStock ? 'text-warning' : 'text-foreground'
                          )}
                        >
                          {product.stock_quantity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.expiry_date ? formatDate(product.expiry_date) : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteProduct(product)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deleteProduct?.name}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

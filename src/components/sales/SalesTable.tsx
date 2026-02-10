import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Sale, Product } from '@/types/database';
import { formatCurrency, formatDateTime } from '@/lib/format';
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
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useDeleteSale } from '@/hooks/useSales';

interface SalesTableProps {
  sales: (Sale & { product: Product })[];
}

export function SalesTable({ sales }: SalesTableProps) {
  const [search, setSearch] = useState('');
  const [deleteSale, setDeleteSale] = useState<Sale & { product: Product } | null>(null);
  const deleteSaleMutation = useDeleteSale();

  const handleDelete = async () => {
    if (deleteSale) {
      await deleteSaleMutation.mutateAsync(deleteSale.id);
      setDeleteSale(null);
    }
  };

  const filteredSales = sales.filter((sale) =>
    sale.product?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por produto..."
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
              <TableHead className="text-center">Qtd</TableHead>
              <TableHead className="text-right">Preço Unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhuma venda encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {sale.product?.name || 'Produto removido'}
                  </TableCell>
                  <TableCell className="text-center">{sale.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(sale.unit_price)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(sale.total_price)}
                  </TableCell>
                  <TableCell className="text-right text-success font-medium">
                    {formatCurrency(sale.profit)}
                  </TableCell>
                  <TableCell className="capitalize">
                    {sale.payment_method === 'credito' ? 'Crédito' :
                      sale.payment_method === 'debito' ? 'Débito' :
                        sale.payment_method === 'pix' ? 'PIX' : 'Dinheiro'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(sale.sale_date)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* 
                          TODO: Implement Edit Dialog separately or reuse SaleFormDialog if adapted. 
                          For now, just Delete is fully implemented via hook hook calls in parent potentially?
                          Actually, SalesTable needs to handle this.
                        */}
                        <DropdownMenuItem
                          onClick={() => setDeleteSale(sale)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteSale} onOpenChange={() => setDeleteSale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover venda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta venda de "{deleteSale?.product?.name}"?
              O estoque será devolvido automaticamente.
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

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

interface SalesTableProps {
  sales: (Sale & { product: Product })[];
}

export function SalesTable({ sales }: SalesTableProps) {
  const [search, setSearch] = useState('');

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
              <TableHead>Data/Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(sale.sale_date)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

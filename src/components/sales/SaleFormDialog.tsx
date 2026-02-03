import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProducts } from '@/hooks/useProducts';
import { useCreateSale } from '@/hooks/useSales';
import { formatCurrency } from '@/lib/format';

const saleSchema = z.object({
  product_id: z.string().min(1, 'Selecione um produto'),
  quantity: z.number().min(1, 'Quantidade mínima é 1'),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface SaleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleFormDialog({ open, onOpenChange }: SaleFormDialogProps) {
  const { data: products } = useProducts();
  const createSale = useCreateSale();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  const selectedProductId = watch('product_id');
  const quantity = watch('quantity') || 1;
  const selectedProduct = products?.find((p) => p.id === selectedProductId);

  const totalPrice = selectedProduct ? selectedProduct.sale_price * quantity : 0;
  const totalProfit = selectedProduct
    ? (selectedProduct.sale_price - selectedProduct.cost_price) * quantity
    : 0;

  const onSubmit = async (data: SaleFormData) => {
    try {
      await createSale.mutateAsync({
        productId: data.product_id,
        quantity: data.quantity,
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Registrar Venda</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="product_id">Produto *</Label>
              <Select
                value={selectedProductId}
                onValueChange={(value) => setValue('product_id', value)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem
                      key={product.id}
                      value={product.id}
                      disabled={product.stock_quantity === 0}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span>{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({product.stock_quantity} em estoque)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.product_id && (
                <p className="text-sm text-destructive mt-1">{errors.product_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.stock_quantity || 1}
                {...register('quantity', { valueAsNumber: true })}
                className="mt-1.5"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>
              )}
              {selectedProduct && (
                <p className="text-xs text-muted-foreground mt-1">
                  Disponível: {selectedProduct.stock_quantity} unidades
                </p>
              )}
            </div>

            {selectedProduct && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-accent rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total da Venda</p>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(totalPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lucro</p>
                  <p className="text-xl font-bold text-success">
                    {formatCurrency(totalProfit)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedProduct}>
              {isSubmitting ? 'Registrando...' : 'Registrar Venda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

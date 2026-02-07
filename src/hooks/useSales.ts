import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sale, Product } from '@/types/database';
import { toast } from 'sonner';

export function useSales(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['sales', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select('*, product:products(*)')
        .order('sale_date', { ascending: false });

      if (startDate) {
        query = query.gte('sale_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('sale_date', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (Sale & { product: Product })[];
    },
  });
}

export function useMonthlySales() {
  return useQuery({
    queryKey: ['sales', 'monthly'],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('sales')
        .select('*, product:products(*)')
        .gte('sale_date', startOfMonth.toISOString())
        .order('sale_date', { ascending: false });

      if (error) throw error;
      return data as (Sale & { product: Product })[];
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      // First, get the product to calculate prices
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      if (!product) throw new Error('Produto não encontrado');

      const typedProduct = product as Product;

      if (typedProduct.stock_quantity < quantity) {
        throw new Error(`Estoque insuficiente. Disponível: ${typedProduct.stock_quantity}`);
      }

      const totalPrice = typedProduct.sale_price * quantity;
      const profit = (typedProduct.sale_price - typedProduct.cost_price) * quantity;

      // Create the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          product_id: productId,
          quantity,
          unit_price: typedProduct.sale_price,
          cost_price: typedProduct.cost_price,
          total_price: totalPrice,
          profit,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Update stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: typedProduct.stock_quantity - quantity })
        .eq('id', productId);

      if (updateError) throw updateError;

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Venda registrada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar venda: ' + error.message);
    },
  });
}

export function useSalesByCategory() {
  return useQuery({
    queryKey: ['sales', 'by-category'],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('sales')
        .select('*, product:products(category)')
        .gte('sale_date', startOfMonth.toISOString());

      if (error) throw error;

      const byCategory: Record<string, { total: number; profit: number; count: number }> = {};

      (data as any[]).forEach((sale) => {
        const category = sale.product?.category || 'outros';
        if (!byCategory[category]) {
          byCategory[category] = { total: 0, profit: 0, count: 0 };
        }
        byCategory[category].total += sale.total_price;
        byCategory[category].profit += sale.profit;
        byCategory[category].count += sale.quantity;
      });

      return byCategory;
    },
  });
}

export function useTopProducts(limit = 5) {
  return useQuery({
    queryKey: ['sales', 'top-products', limit],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('sales')
        .select('product_id, quantity, profit, product:products(name)')
        .gte('sale_date', startOfMonth.toISOString());

      if (error) throw error;

      const productStats: Record<string, { name: string; quantity: number; profit: number }> = {};

      (data as any[]).forEach((sale) => {
        const id = sale.product_id;
        if (!productStats[id]) {
          productStats[id] = {
            name: sale.product?.name || 'Produto',
            quantity: 0,
            profit: 0,
          };
        }
        productStats[id].quantity += sale.quantity;
        productStats[id].profit += sale.profit;
      });

      return Object.entries(productStats)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, limit);
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: sale, error: fetchError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Restore stock
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', sale.product_id)
        .single();

      if (product) {
        await supabase
          .from('products')
          .update({ stock_quantity: product.stock_quantity + sale.quantity })
          .eq('id', sale.product_id);
      }

      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Venda removida com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover venda: ' + error.message);
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { data: oldSale, error: fetchError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const diff = quantity - oldSale.quantity;

      if (diff === 0) return;

      // Check stock availability if increasing quantity
      if (diff > 0) {
        const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', oldSale.product_id).single();
        if (!product || product.stock_quantity < diff) {
          throw new Error(`Estoque insuficiente. Disponível: ${product.stock_quantity}`);
        }
      }

      // Update Stock
      const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', oldSale.product_id).single();
      if (product) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: product.stock_quantity - diff })
          .eq('id', oldSale.product_id);

        if (stockError) throw stockError;
      }

      // Recalculate totals
      const { data: productInfo } = await supabase.from('products').select('*').eq('id', oldSale.product_id).single();
      if (!productInfo) throw new Error("Produto não encontrado");

      const totalPrice = productInfo.sale_price * quantity;
      const profit = (productInfo.sale_price - productInfo.cost_price) * quantity;

      const { error } = await supabase
        .from('sales')
        .update({
          quantity,
          total_price: totalPrice,
          profit
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Venda atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar venda: ' + error.message);
    },
  });
}

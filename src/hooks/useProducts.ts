import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductCategory } from '@/types/database';
import { toast } from 'sonner';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, supplier:suppliers(*)')
        .order('name');
      
      if (error) throw error;
      return data as (Product & { supplier: { id: string; name: string } | null })[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, supplier:suppliers(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          category: product.category,
          cost_price: product.cost_price,
          sale_price: product.sale_price,
          supplier_id: product.supplier_id,
          stock_quantity: product.stock_quantity,
          min_stock: product.min_stock,
          entry_date: product.entry_date,
          expiry_date: product.expiry_date,
          notes: product.notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto cadastrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar produto: ' + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: product.name,
          category: product.category,
          cost_price: product.cost_price,
          sale_price: product.sale_price,
          supplier_id: product.supplier_id,
          stock_quantity: product.stock_quantity,
          min_stock: product.min_stock,
          entry_date: product.entry_date,
          expiry_date: product.expiry_date,
          notes: product.notes,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto removido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover produto: ' + error.message);
    },
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('stock_quantity');
      
      if (error) throw error;
      return (data as Product[]).filter(p => p.stock_quantity <= p.min_stock);
    },
  });
}

export function useExpiringProducts() {
  return useQuery({
    queryKey: ['products', 'expiring'],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('expiry_date', 'is', null)
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('expiry_date');
      
      if (error) throw error;
      return data as Product[];
    },
  });
}

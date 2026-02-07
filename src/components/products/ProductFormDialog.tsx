import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useSuppliers, useCreateSupplier } from '@/hooks/useSuppliers';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { Product, ProductCategory, categoryLabels } from '@/types/database';
import { Plus, Check, X, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ... (schema remains same)
const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  cost_price: z.number().min(0.01, 'Preço de custo deve ser maior que 0'),
  sale_price: z.number().min(0.01, 'Preço de venda deve ser maior que 0'),
  supplier_id: z.string().optional(),
  stock_quantity: z.number().min(0, 'Quantidade não pode ser negativa'),
  min_stock: z.number().min(0, 'Estoque mínimo não pode ser negativo'),
  entry_date: z.string().min(1, 'Data de entrada é obrigatória'),
  expiry_date: z.string().optional(),
  notes: z.string().max(500, 'Observações muito longas').optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  const isEditing = !!product;
  const { user } = useAuth();
  const { data: suppliers } = useSuppliers();
  const { data: customCategories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createSupplier = useCreateSupplier();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
        name: product.name,
        category: product.category,
        cost_price: product.cost_price,
        sale_price: product.sale_price,
        supplier_id: product.supplier_id || undefined,
        stock_quantity: product.stock_quantity,
        min_stock: product.min_stock,
        entry_date: product.entry_date,
        expiry_date: product.expiry_date || undefined,
        notes: product.notes || undefined,
      }
      : {
        category: 'outros',
        stock_quantity: 0,
        min_stock: 5,
        entry_date: new Date().toISOString().split('T')[0],
      },
  });

  const costPrice = watch('cost_price');
  const salePrice = watch('sale_price');
  const unitProfit = salePrice && costPrice ? salePrice - costPrice : 0;
  const margin = costPrice && costPrice > 0 ? ((salePrice - costPrice) / costPrice) * 100 : 0;

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim() || !user) return;
    setIsCreatingSupplier(true);
    try {
      const newSupplier = await createSupplier.mutateAsync({
        name: newSupplierName,
        email: null,
        phone: null,
        user_id: user.id
      });
      setValue('supplier_id', newSupplier.id);
      setIsAddingSupplier(false);
      setNewSupplierName('');
      toast.success('Fornecedor criado!');
    } catch (error) {
      // toast handled by hook
    } finally {
      setIsCreatingSupplier(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !user) return;
    setIsCreatingCategory(true);
    try {
      const newCategory = await createCategory.mutateAsync({
        name: newCategoryName,
        user_id: user.id
      });
      setValue('category', newCategory.name);
      setIsAddingCategory(false);
      setNewCategoryName('');
      // toast handled by hook
    } catch (error) {
      // toast handled by hook
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    const currentCategory = watch('category');
    if (!currentCategory) return;

    // Find if it's a custom category
    const customCat = customCategories?.find(c => c.name === currentCategory);
    if (!customCat) {
      toast.error('Não é possível remover categorias padrão do sistema.');
      return;
    }

    if (confirm(`Tem certeza que deseja remover a categoria "${currentCategory}"?`)) {
      try {
        await deleteCategory.mutateAsync(customCat.id);
        setValue('category', '');
      } catch (error) {
        // toast handled by hook
      }
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!user) {
      toast.error('Erro de autenticação');
      return;
    }

    try {
      const productData = {
        name: data.name,
        category: data.category as ProductCategory,
        cost_price: data.cost_price,
        sale_price: data.sale_price,
        supplier_id: data.supplier_id || null,
        stock_quantity: data.stock_quantity,
        min_stock: data.min_stock,
        entry_date: data.entry_date,
        expiry_date: data.expiry_date || null,
        notes: data.notes || null,
        user_id: user.id
      };

      if (isEditing) {
        await updateProduct.mutateAsync({ id: product.id, ...productData });
      } else {
        await createProduct.mutateAsync(productData);
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Leite Integral 1L"
                className="mt-1.5"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Categoria *</Label>
              {isAddingCategory ? (
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nova categoria"
                    className="h-10"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleCreateCategory}
                    disabled={isCreatingCategory || !newCategoryName}
                  >
                    {isCreatingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAddingCategory(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-1.5">
                  <Select
                    value={watch('category')}
                    onValueChange={(value) => setValue('category', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled className="font-semibold text-muted-foreground">
                        Padrão
                      </SelectItem>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                      {customCategories && customCategories.length > 0 && (
                        <>
                          <SelectItem value="custom-divider" disabled className="font-semibold text-muted-foreground mt-2 border-t pt-2">
                            Personalizadas
                          </SelectItem>
                          {customCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddingCategory(true)}
                    title="Adicionar Categoria"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleDeleteCategory}
                    disabled={!customCategories?.some(c => c.name === watch('category'))}
                    title="Remover Categoria Selecionada"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {errors.category && (
                <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="supplier_id">Fornecedor</Label>
              {isAddingSupplier ? (
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="Nome do fornecedor"
                    className="h-10"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleCreateSupplier}
                    disabled={isCreatingSupplier || !newSupplierName}
                  >
                    {isCreatingSupplier ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAddingSupplier(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-1.5">
                  <Select
                    value={watch('supplier_id') || 'none'}
                    onValueChange={(value) => setValue('supplier_id', value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddingSupplier(true)}
                    title="Adicionar Fornecedor"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="cost_price">Preço de Custo (R$) *</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                {...register('cost_price', { valueAsNumber: true })}
                placeholder="0,00"
                className="mt-1.5"
              />
              {errors.cost_price && (
                <p className="text-sm text-destructive mt-1">{errors.cost_price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sale_price">Preço de Venda (R$) *</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                min="0"
                {...register('sale_price', { valueAsNumber: true })}
                placeholder="0,00"
                className="mt-1.5"
              />
              {errors.sale_price && (
                <p className="text-sm text-destructive mt-1">{errors.sale_price.message}</p>
              )}
            </div>

            {/* Calculated fields */}
            <div className="col-span-2 grid grid-cols-2 gap-4 p-4 bg-accent rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Unitário</p>
                <p className="text-lg font-semibold text-success">
                  R$ {unitProfit.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                <p className="text-lg font-semibold text-primary">
                  {margin.toFixed(1)}%
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="stock_quantity">Quantidade em Estoque *</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                {...register('stock_quantity', { valueAsNumber: true })}
                placeholder="0"
                className="mt-1.5"
              />
              {errors.stock_quantity && (
                <p className="text-sm text-destructive mt-1">{errors.stock_quantity.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="min_stock">Estoque Mínimo *</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                {...register('min_stock', { valueAsNumber: true })}
                placeholder="5"
                className="mt-1.5"
              />
              {errors.min_stock && (
                <p className="text-sm text-destructive mt-1">{errors.min_stock.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="entry_date">Data de Entrada *</Label>
              <Input
                id="entry_date"
                type="date"
                {...register('entry_date')}
                className="mt-1.5"
              />
              {errors.entry_date && (
                <p className="text-sm text-destructive mt-1">{errors.entry_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="expiry_date">Data de Validade</Label>
              <Input
                id="expiry_date"
                type="date"
                {...register('expiry_date')}
                className="mt-1.5"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Observações sobre o produto (sazonalidade, promoções, etc.)"
                className="mt-1.5"
                rows={3}
              />
              {errors.notes && (
                <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

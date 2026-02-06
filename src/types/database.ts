export type ProductCategory = 
  | 'bebidas'
  | 'laticinios'
  | 'carnes'
  | 'frutas_verduras'
  | 'padaria'
  | 'limpeza'
  | 'higiene'
  | 'congelados'
  | 'graos_cereais'
  | 'enlatados'
  | 'outros';

export const categoryLabels: Record<ProductCategory, string> = {
  bebidas: 'Bebidas',
  laticinios: 'Laticínios',
  carnes: 'Carnes',
  frutas_verduras: 'Frutas e Verduras',
  padaria: 'Padaria',
  limpeza: 'Limpeza',
  higiene: 'Higiene',
  congelados: 'Congelados',
  graos_cereais: 'Grãos e Cereais',
  enlatados: 'Enlatados',
  outros: 'Outros',
};

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  category: ProductCategory;
  cost_price: number;
  sale_price: number;
  supplier_id: string | null;
  stock_quantity: number;
  min_stock: number;
  entry_date: string;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface Sale {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  total_price: number;
  profit: number;
  sale_date: string;
  created_at: string;
  product?: Product;
}

export interface Expense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  profitMargin: number;
  totalProductsSold: number;
  averageTicket: number;
  lowStockProducts: number;
  expiringProducts: number;
}

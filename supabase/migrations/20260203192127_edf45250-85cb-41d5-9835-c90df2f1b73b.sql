-- Criar enum para categorias de produtos
CREATE TYPE public.product_category AS ENUM (
  'bebidas',
  'laticinios',
  'carnes',
  'frutas_verduras',
  'padaria',
  'limpeza',
  'higiene',
  'congelados',
  'graos_cereais',
  'enlatados',
  'outros'
);

-- Criar tabela de fornecedores
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category product_category NOT NULL DEFAULT 'outros',
  cost_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de vendas
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de despesas
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'geral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (sem autenticação para esta versão inicial)
CREATE POLICY "Allow public read suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Allow public insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update suppliers" ON public.suppliers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete suppliers" ON public.suppliers FOR DELETE USING (true);

CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public read sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Allow public insert sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update sales" ON public.sales FOR UPDATE USING (true);
CREATE POLICY "Allow public delete sales" ON public.sales FOR DELETE USING (true);

CREATE POLICY "Allow public read expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete expenses" ON public.expenses FOR DELETE USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular lucro unitário
CREATE OR REPLACE FUNCTION public.calculate_profit(sale_price DECIMAL, cost_price DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN sale_price - cost_price;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para calcular margem de lucro
CREATE OR REPLACE FUNCTION public.calculate_margin(sale_price DECIMAL, cost_price DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF cost_price = 0 THEN
    RETURN 0;
  END IF;
  RETURN ((sale_price - cost_price) / cost_price) * 100;
END;
$$ LANGUAGE plpgsql SET search_path = public;
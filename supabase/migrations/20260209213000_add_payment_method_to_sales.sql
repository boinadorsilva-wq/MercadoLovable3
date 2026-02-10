-- Add payment_method column to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'dinheiro';

-- Optional: Create an index for reporting performance
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);

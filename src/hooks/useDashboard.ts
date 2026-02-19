import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardMetrics, Sale, Product, Expense } from '@/types/database';
import { toast } from 'sonner';

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async (): Promise<DashboardMetrics> => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Get sales for the month
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .gte('sale_date', startOfMonth.toISOString());

      if (salesError) throw salesError;

      // Get expenses for the month
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', startOfMonth.toISOString().split('T')[0]);

      if (expensesError) throw expensesError;

      // Get low stock products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      const typedSales = sales as Sale[];
      const typedExpenses = expenses as Expense[];
      const typedProducts = products as Product[];

      const totalRevenue = typedSales.reduce((sum, sale) => sum + Number(sale.total_price), 0);
      const totalSalesProfit = typedSales.reduce((sum, sale) => sum + Number(sale.profit), 0);
      const totalExpenses = typedExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

      // Profit is Sales Profit (Revenue - Product Cost) - Operational Expenses
      const totalProfit = totalSalesProfit - totalExpenses;

      const totalProductsSold = typedSales.reduce((sum, sale) => sum + sale.quantity, 0);

      const lowStockProducts = typedProducts.filter(p => p.stock_quantity <= p.min_stock).length;

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringProducts = typedProducts.filter(
        p => p.expiry_date && new Date(p.expiry_date) <= thirtyDaysFromNow
      ).length;

      return {
        totalRevenue,
        totalProfit,
        totalExpenses,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        totalProductsSold,
        averageTicket: typedSales.length > 0 ? totalRevenue / typedSales.length : 0,
        lowStockProducts,
        expiringProducts,
      };
    },
  });
}

export function useMonthlySalesChart() {
  return useQuery({
    queryKey: ['dashboard', 'monthly-chart'],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      // Fetch sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total_price, profit, cost_price, sale_date')
        .gte('sale_date', sixMonthsAgo.toISOString())
        .order('sale_date');

      if (salesError) throw salesError;

      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .gte('expense_date', sixMonthsAgo.toISOString().split('T')[0]);

      if (expensesError) throw expensesError;

      const monthlyData: Record<string, { month: string; revenue: number; profit: number; costs: number }> = {};
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      // Initialize months
      for (let i = 0; i < 6; i++) {
        const d = new Date(sixMonthsAgo);
        d.setMonth(d.getMonth() + i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const monthName = months[d.getMonth()];
        monthlyData[key] = { month: monthName, revenue: 0, profit: 0, costs: 0 };
      }

      // Process Sales
      (sales as any[]).forEach((sale) => {
        const date = new Date(sale.sale_date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;

        if (monthlyData[key]) {
          monthlyData[key].revenue += Number(sale.total_price);
          // Initial profit from sales (Revenue - Product Cost)
          // We will subtract expenses later
          const productCost = Number(sale.total_price) - Number(sale.profit);
          monthlyData[key].costs += productCost;
        }
      });

      // Process Expenses
      (expenses as any[]).forEach((expense) => {
        const date = new Date(expense.expense_date);
        // Adjust for timezone if necessary, but date string 'YYYY-MM-DD' usually parses to UTC 00:00
        // Use verify logic if dates are off by one day due to timezone
        // For simplicity assuming local date matches report month
        const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;

        if (monthlyData[key]) {
          monthlyData[key].costs += Number(expense.amount);
        }
      });

      // Calculate Final Profit
      Object.keys(monthlyData).forEach(key => {
        monthlyData[key].profit = monthlyData[key].revenue - monthlyData[key].costs;
      });

      return Object.values(monthlyData);
    },
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Despesa adicionada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar despesa: ' + error.message);
    },
  });
}

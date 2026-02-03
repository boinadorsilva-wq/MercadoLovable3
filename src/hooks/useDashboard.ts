import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardMetrics, Sale, Product, Expense } from '@/types/database';

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
      const totalProfit = typedSales.reduce((sum, sale) => sum + Number(sale.profit), 0);
      const totalExpenses = typedExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const totalProductsSold = typedSales.reduce((sum, sale) => sum + sale.quantity, 0);
      
      const lowStockProducts = typedProducts.filter(p => p.stock_quantity <= p.min_stock).length;
      
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringProducts = typedProducts.filter(
        p => p.expiry_date && new Date(p.expiry_date) <= thirtyDaysFromNow
      ).length;
      
      return {
        totalRevenue,
        totalProfit: totalProfit - totalExpenses,
        totalExpenses,
        profitMargin: totalRevenue > 0 ? ((totalProfit - totalExpenses) / totalRevenue) * 100 : 0,
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
      
      const { data, error } = await supabase
        .from('sales')
        .select('total_price, profit, sale_date')
        .gte('sale_date', sixMonthsAgo.toISOString())
        .order('sale_date');
      
      if (error) throw error;
      
      const monthlyData: Record<string, { month: string; revenue: number; profit: number }> = {};
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      (data as Sale[]).forEach((sale) => {
        const date = new Date(sale.sale_date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = months[date.getMonth()];
        
        if (!monthlyData[key]) {
          monthlyData[key] = { month: monthName, revenue: 0, profit: 0 };
        }
        monthlyData[key].revenue += Number(sale.total_price);
        monthlyData[key].profit += Number(sale.profit);
      });
      
      return Object.values(monthlyData);
    },
  });
}

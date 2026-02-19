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


export function useSalesChart(period: 'today' | 'weekly' | 'monthly' = 'monthly') {
  return useQuery({
    queryKey: ['dashboard', 'chart', period],
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();

      if (period === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'weekly') {
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate.setMonth(now.getMonth() - 5);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }

      // Fetch sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total_price, profit, cost_price, sale_date')
        .gte('sale_date', startDate.toISOString())
        .order('sale_date');

      if (salesError) throw salesError;

      // Fetch expenses (only for weekly and monthly)
      let expenses: any[] = [];
      if (period !== 'today') {
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('amount, expense_date')
          .gte('expense_date', startDate.toISOString().split('T')[0]);

        if (expensesError) throw expensesError;
        expenses = expensesData || [];
      }

      const chartData: Record<string, { label: string; revenue: number; profit: number; costs: number; order: number }> = {};

      // Initialize Data Points
      if (period === 'today') {
        for (let i = 0; i <= now.getHours(); i++) {
          const label = `${i.toString().padStart(2, '0')}:00`;
          chartData[i] = { label, revenue: 0, profit: 0, costs: 0, order: i };
        }
      } else if (period === 'weekly') {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(now.getDate() - (6 - i));
          const key = d.toISOString().split('T')[0];
          const label = days[d.getDay()];
          chartData[key] = { label, revenue: 0, profit: 0, costs: 0, order: i };
        }
      } else {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        for (let i = 0; i < 6; i++) {
          const d = new Date(startDate);
          d.setMonth(d.getMonth() + i);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const label = months[d.getMonth()];
          chartData[key] = { label, revenue: 0, profit: 0, costs: 0, order: i };
        }
      }

      // Process Sales
      (sales as any[]).forEach((sale) => {
        const date = new Date(sale.sale_date);
        let key = '';

        if (period === 'today') {
          // For today, we might want to check if the sale date is actually today
          // The query already filters >= startOfToday, but let's be safe with timezone if needed
          key = date.getHours().toString();
        } else if (period === 'weekly') {
          key = date.toISOString().split('T')[0];
        } else {
          key = `${date.getFullYear()}-${date.getMonth()}`;
        }

        if (chartData[key]) {
          chartData[key].revenue += Number(sale.total_price);
          const productCost = Number(sale.total_price) - Number(sale.profit);
          chartData[key].costs += productCost;
        }
      });

      // Process Expenses
      if (period !== 'today') {
        expenses.forEach((expense) => {
          const date = new Date(expense.expense_date);
          // Assuming expense_date is YYYY-MM-DD
          // For weekly, key is YYYY-MM-DD. For monthly, key is YYYY-M
          let key = '';
          if (period === 'weekly') {
            // We need to match the date string directly
            // expense_date is string 'YYYY-MM-DD'
            key = expense.expense_date;
          } else {
            key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
          }

          if (chartData[key]) {
            chartData[key].costs += Number(expense.amount);
          }
        });
      }

      // Calculate Final Profit and format return
      return Object.values(chartData)
        .sort((a, b) => a.order - b.order)
        .map(item => ({
          month: item.label, // Reusing 'month' key for compatibility with RevenueChart component props
          revenue: item.revenue,
          profit: item.revenue - item.costs,
          costs: item.costs
        }));
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

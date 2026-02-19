import { AppLayout } from '@/components/layout/AppLayout';
import { useSalesChart } from '@/hooks/useDashboard';
import { useSalesByCategory, useTopProducts, useSalesByPaymentMethod } from '@/hooks/useSales';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { formatCurrency } from '@/lib/format';
import { categoryLabels, ProductCategory } from '@/types/database';
import { BarChart3, PieChart, TrendingUp, Download, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateSalesReportPDF, SalesReportData } from '@/utils/generatePDF';
import { toast } from 'sonner';

const COLORS = [
  'hsl(160, 84%, 39%)',
  'hsl(200, 70%, 50%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(0, 84%, 60%)',
  'hsl(120, 60%, 45%)',
  'hsl(240, 60%, 60%)',
  'hsl(30, 80%, 55%)',
  'hsl(180, 70%, 45%)',
  'hsl(320, 70%, 55%)',
  'hsl(60, 80%, 45%)',
];

export default function Relatorios() {
  const [period, setPeriod] = useState<'today' | 'weekly' | 'monthly'>('monthly');
  const { data: chartData, isLoading: chartLoading } = useSalesChart(period);
  const { data: categoryData, isLoading: categoryLoading } = useSalesByCategory();
  const { data: topProducts, isLoading: topLoading } = useTopProducts(10);
  const { data: paymentData, isLoading: paymentLoading } = useSalesByPaymentMethod();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      toast.info('Gerando relatório PDF...');

      const { data, error } = await supabase
        .from('sales')
        .select('*, product:products(*)')
        .order('sale_date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.warning('Nenhuma venda encontrada para gerar o relatório.');
        return;
      }

      generateSalesReportPDF(data as unknown as SalesReportData[]);
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o relatório PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const pieData = categoryData
    ? Object.entries(categoryData).map(([category, data]) => ({
      name: categoryLabels[category as ProductCategory] || category,
      value: data.total,
      profit: data.profit,
      count: data.count,
    }))
    : [];

  const barData = topProducts?.map((product) => ({
    name: product.name.length > 15 ? product.name.slice(0, 15) + '...' : product.name,
    lucro: product.profit,
    quantidade: product.quantity,
  })) || [];

  const isLoading = chartLoading || categoryLoading || topLoading || paymentLoading;

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Relatórios
            </h1>
            <p className="mt-1 text-muted-foreground">
              Análises e métricas do seu negócio
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isGeneratingPDF ? 'Gerando...' : 'Exportar PDF'}
          </Button>
        </div>

        {/* Revenue Chart */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Evolução {period === 'today' ? 'Diária' : period === 'weekly' ? 'Semanal' : 'Mensal'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Receita e lucro {period === 'today' ? 'de hoje' : period === 'weekly' ? 'dos últimos 7 dias' : 'dos últimos 6 meses'}
                </p>
              </div>
            </div>

            <div className="flex bg-muted p-1 rounded-lg">
              <Button
                variant={period === 'today' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPeriod('today')}
                className="text-xs"
              >
                Hoje
              </Button>
              <Button
                variant={period === 'weekly' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPeriod('weekly')}
                className="text-xs"
              >
                Semanal
              </Button>
              <Button
                variant={period === 'monthly' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPeriod('monthly')}
                className="text-xs"
              >
                Mensal
              </Button>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-[350px] w-full rounded-xl" />
          ) : (
            <RevenueChart data={chartData || []} />
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Pie Chart */}
          <div className="metric-card">
            <div className="flex items-center gap-3 mb-4">
              <PieChart className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Vendas por Categoria
              </h3>
            </div>
            {categoryLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : pieData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma venda registrada
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                            <p className="text-sm font-medium text-foreground">
                              {data.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total: {formatCurrency(data.value)}
                            </p>
                            <p className="text-sm text-success">
                              Lucro: {formatCurrency(data.profit)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {data.count} itens vendidos
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Products Bar Chart */}
          <div className="metric-card">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Top 10 Produtos por Lucro
              </h3>
            </div>
            {topLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : barData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma venda registrada
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    width={100}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                            <p className="text-sm font-medium text-foreground">
                              {data.name}
                            </p>
                            <p className="text-sm text-success">
                              Lucro: {formatCurrency(data.lucro)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {data.quantidade} vendidos
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="lucro"
                    fill="hsl(160, 84%, 39%)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment Method Pie Chart */}
          <div className="metric-card">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Vendas por Pagamento
              </h3>
            </div>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : !paymentData || Object.keys(paymentData).length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma venda registrada
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={Object.entries(paymentData).map(([method, data]) => ({
                      name: method === 'credito' ? 'Crédito' :
                        method === 'debito' ? 'Débito' :
                          method === 'pix' ? 'PIX' : 'Dinheiro',
                      value: data.total,
                      count: data.count
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {Object.entries(paymentData).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                            <p className="text-sm font-medium text-foreground">
                              {data.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total: {formatCurrency(data.value)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {data.count} pagamentos
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

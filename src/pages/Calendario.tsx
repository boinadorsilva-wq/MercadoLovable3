import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSales } from '@/hooks/useSales';
import { formatCurrency, formatDate } from '@/lib/format';
import { DollarSign, TrendingUp, ShoppingCart, Loader2 } from 'lucide-react';
import { ptBR } from 'date-fns/locale';

export default function Calendario() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const { data: sales, isLoading } = useSales();

    // Aggregate sales by day
    const salesByDay = sales?.reduce((acc, sale) => {
        const day = new Date(sale.sale_date).toDateString();
        if (!acc[day]) {
            acc[day] = { revenue: 0, profit: 0, count: 0, sales: [] };
        }
        acc[day].revenue += Number(sale.total_price);
        acc[day].profit += Number(sale.profit);
        acc[day].count += sale.quantity;
        acc[day].sales.push(sale);
        return acc;
    }, {} as Record<string, { revenue: number; profit: number; count: number; sales: any[] }>) || {};

    const selectedDayData = date ? salesByDay[date.toDateString()] : null;

    // Modifiers to highlight days with profit
    const hasSalesDays = Object.keys(salesByDay).map(d => new Date(d));

    return (
        <AppLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">
                        Calendário de Resultados
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Visualize seu desempenho dia a dia
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Calendar Section */}
                    <div className="md:col-span-5 lg:col-span-4">
                        <Card className="h-full">
                            <CardContent className="p-4 flex justify-center">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    locale={ptBR}
                                    className="rounded-md border shadow-sm p-3 pointer-events-auto"
                                    modifiers={{
                                        hasSales: hasSalesDays
                                    }}
                                    modifiersStyles={{
                                        hasSales: { fontWeight: 'bold', color: 'var(--primary)' }
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Details Section */}
                    <div className="md:col-span-7 lg:col-span-8 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {date ? formatDate(date.toISOString()) : 'Selecione uma data'}
                                </CardTitle>
                                <CardDescription>
                                    Resumo financeiro do dia
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : selectedDayData ? (
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-primary/20 rounded-lg">
                                                    <DollarSign className="w-5 h-5 text-primary" />
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">Receita</span>
                                            </div>
                                            <p className="text-2xl font-bold text-foreground">
                                                {formatCurrency(selectedDayData.revenue)}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-success/20 rounded-lg">
                                                    <TrendingUp className="w-5 h-5 text-success" />
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">Lucro</span>
                                            </div>
                                            <p className="text-2xl font-bold text-success">
                                                {formatCurrency(selectedDayData.profit)}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-info/10 border border-info/20">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-info/20 rounded-lg">
                                                    <ShoppingCart className="w-5 h-5 text-info" />
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">Vendas</span>
                                            </div>
                                            <p className="text-2xl font-bold text-foreground">
                                                {selectedDayData.count} itens
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>Nenhuma venda registrada neste dia.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Optional: List of sales for the day */}
                        {selectedDayData && selectedDayData.sales.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Detalhamento</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {selectedDayData.sales.map((sale: any) => (
                                            <div key={sale.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-medium">{sale.product?.name || 'Produto'}</p>
                                                    <p className="text-xs text-muted-foreground">{sale.quantity}x {formatCurrency(sale.unit_price)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-success">+{formatCurrency(sale.profit)}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(sale.sale_date).toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

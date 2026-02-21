import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, Product } from '@/types/database';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface SalesReportData extends Sale {
    product?: Product;
}

export const generateSalesReportPDF = (sales: SalesReportData[]) => {
    const doc = new jsPDF();

    const title = 'Relatório de Vendas - Mercado PRO';
    const subTitle = `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`;

    doc.setFontSize(20);
    doc.text(title, 14, 22);

    doc.setFontSize(10);
    doc.text(subTitle, 14, 30);

    const tableColumn = [
        'Data',
        'Produto',
        'Qtd',
        'Preço Unit.',
        'Total',
        'Lucro',
        'Pagamento'
    ];

    const tableRows = sales.map((sale) => [
        format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        sale.product?.name || 'Produto Removido',
        sale.quantity,
        formatCurrency(sale.unit_price),
        formatCurrency(sale.total_price),
        formatCurrency(sale.profit),
        sale.payment_method === 'credito' ? 'Crédito' :
            sale.payment_method === 'debito' ? 'Débito' :
                sale.payment_method === 'pix' ? 'PIX' : 'Dinheiro'
    ]);

    // Calculate totals
    const totalSales = sales.reduce((sum, sale) => sum + sale.total_price, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 163, 74] }, // Primary green color
    });

    // Add summary at the bottom
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.text(`Total de Vendas: ${formatCurrency(totalSales)}`, 14, finalY);
    doc.text(`Lucro Total: ${formatCurrency(totalProfit)}`, 14, finalY + 5);
    doc.text(`Total de Itens: ${totalItems}`, 14, finalY + 10);

    doc.save(`relatorio_vendas_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

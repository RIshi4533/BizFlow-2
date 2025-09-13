
import jsPDF from 'jspdf';
import 'jspdf-autotable';

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// A simple base64 encoded PNG for the logo.
const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACGUlEQVR4Ae2WA4xdQRSA3+99l7a1LeyiFNso2AhWIDEBRUHEBUHw4ANiVUSEUXwBBVFERESRkYig4AMoMmLxgogfICCKiIgo4cXO3v1PMyYkS6w27b1PnJtLzplv5ty5c86cOQsx/r8YAxYAF4Bl4DpwDHgFvAEOzcw+9iQzYybAOWAVuAg8BvYBdwBvzsx+LgXoYxgAfgC+Bf4BjgD/A1fOzP4sBaljGAM+AF4EfgL+An4Czp2ZXRmI2BkwCvgV2Bi4AzwAjp2ZPQd4BnwJCn4AngLOnJldTUTqgC7gLdCsQp2B+4Bv5WV/AbcD78zMXiYj1gGfAf+AOZgZgP3AGfA78POZ2RVEjA0gCjwBjgf+AdYDRzKzq3KyPQLuAQcSsAoczo6NbgZ+A/5aA/8DP8rMPgfeB/4L/A9sSc0eA/sCuzKzrwPbgE+A41Zk5kNgf2BDZvaJgPmZ2b8Cv5iZfQasb+YDsC4ze1iG+gXcD7wBfAU8A8bOzD4G3gH+B9YkZr8GdiRmvwmcnZn9LCLWAn8BvzMzejcwMzP7A3C8BewHzs/MPhSYnJm9KjL7N/CDmZ1IdhYBVwL/Bv6TAY0GfAb8IisTwwMwJXmAG+DjQlyvAecC/yICfgb+TUS8b2V+/wyp4fD/wD8S0e04sBO4a2b2vQA2A8/MzP6VmR0f2M3sO2BaZvbrAOwHfgR+DnxnZvYE0F0A3wEnzsz+SMyuA7YDs8AnYAowG1iSmf0rsDkze1Vm9ofAmszsHwG2A1uzY/ZX4EdgW2b2l4DYBNBdwDkze11gVma2Gog4HdgJPAecn5n9HTAA2AbcAJwEfgBWAUuzYwH4EzgLPDszG4BYBUaAU8BZ4ADwBHgCPAIeAF+A48BJ4GlgC3ABeAgsA5YAv2Bm9wGshvgBmAecARzKzA4C3QA2A78C3wNPzsw+BfYBswGfAb8AfwOvzMysAn0A/gL2BWYDzwJzYGYvA/cA3wF/Am+Az4DPgX8AkzOzB4BlwFmAa8Bb4BvgJ+A/wJbM7BcgBngZeAz8xMxeBXYDtwFvgP8Cj2RmHwWGAW8B32Zm1wCzge3AP+DXwGhm9jLwAvgS2APsBGaBV8A14BPwnczsX2AasCtwSPrfFmB2oN8d4A/pGrGvY86nLAAAAABJRU5ErkJggg==';

export const handlePdfExport = (transactions: Transaction[], totalRevenue: number, totalExpenses: number, netProfit: number) => {
    if (transactions.length === 0) return;
    const doc = new jsPDF();
    
    doc.addImage(logoBase64, 'PNG', 14, 15, 10, 10);
    
    // Add a title
    doc.setFontSize(18);
    doc.text("Financial Report", 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Report generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["ID", "Date", "Description", "Amount", "Status"];
    const tableRows: (string | number)[][] = [];

    transactions.forEach(transaction => {
      const transactionData = [
        transaction.id,
        new Date(transaction.date).toLocaleDateString(),
        transaction.description,
        formatCurrency(transaction.amount),
        transaction.status,
      ];
      tableRows.push(transactionData);
    });
    
    // Add summary section before the table
    doc.setFontSize(14);
    doc.text("Summary", 14, 45);
    
    doc.setFontSize(12);
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 14, 55);
    doc.text(`Total Expenses: ${formatCurrency(Math.abs(totalExpenses))}`, 14, 62);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Net Profit: ${formatCurrency(netProfit)}`, 14, 72);
    doc.setFont('helvetica', 'normal');
    
    // Add the table after the summary
    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 85,
        headStyles: { fillColor: [30, 58, 138] }, // Deep Blue header
        theme: 'striped'
    });

    doc.save("financial-report.pdf");
  };

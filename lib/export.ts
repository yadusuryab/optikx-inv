// lib/export.ts
// CSV export utilities for orders and expenses

import type { Order, Expense, ProductAnalytics } from '@/types';

function escapeCsv(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportOrdersCsv(orders: Order[]): void {
  const headers :any= ['Date', 'Product', 'SKU', 'Qty', 'Selling Price', 'Cost Price', 'Revenue', 'Profit'];
  const rows:any = orders.map((o) => [
    o.date,
    o.products?.name ?? o.product_id,
    o.products?.sku ?? '',
    o.quantity,
    o.selling_price,
    o.cost_price,
    o.selling_price * o.quantity,
    (o.selling_price - o.cost_price) * o.quantity,
  ]);
  downloadCsv('orders.csv', [headers, ...rows]);
}

export function exportExpensesCsv(expenses: Expense[]): void {
  const headers = ['Date', 'Title', 'Category', 'Amount'];
  const rows :any= expenses.map((e) => [e.date, e.title, e.category, e.amount]);
  downloadCsv('expenses.csv', [headers, ...rows]);
}

export function exportAnalyticsCsv(analytics: ProductAnalytics[]): void {
  const headers = [
    'Product', 'SKU', 'Qty Sold', 'Revenue', 'Cost',
    'Gross Profit', 'Marketing Allocated', 'Net Profit',
  ];
  const rows:any = analytics.map((p) => [
    p.name,
    p.sku ?? '',
    p.totalQuantitySold,
    p.totalRevenue.toFixed(2),
    p.totalCost.toFixed(2),
    p.grossProfit.toFixed(2),
    p.marketingCostAllocated.toFixed(2),
    p.netProfit.toFixed(2),
  ]);
  downloadCsv('analytics.csv', [headers, ...rows]);
}

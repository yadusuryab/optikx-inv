// app/(app)/dashboard/page.tsx
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { calculateDashboardMetrics, buildRevenueChartData, formatCurrency } from '@/lib/calculations';
import { getAllOrders } from '@/app/actions/orders';
import { getExpenses } from '@/app/actions/expenses';
import { getProducts } from '@/app/actions/products';
import { MetricCard } from '@/components/ui';
import DashboardCharts from '@/components/charts/DashboardCharts';
import LowStockAlert from '@/components/charts/LowStockAlert';

export const dynamic = 'force-dynamic';

const LOW_STOCK_THRESHOLD = 10;

export default async function DashboardPage() {
  const [orders, expenses, products] = await Promise.all([
    getAllOrders(),
    getExpenses(),
    getProducts(),
  ]);

  const metrics = calculateDashboardMetrics(orders, expenses);
  const chartData = buildRevenueChartData(orders, expenses);
  const lowStockProducts = products.filter((p) => p.quantity <= LOW_STOCK_THRESHOLD);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your business at a glance</p>
      </div>

      {/* Low stock alerts */}
      {lowStockProducts.length > 0 && (
        <LowStockAlert products={lowStockProducts} />
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
          accent="bg-blue-50 text-blue-600"
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(metrics.netProfit)}
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          accent={metrics.netProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}
          changeType={metrics.netProfit >= 0 ? 'positive' : 'negative'}
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(metrics.totalExpenses)}
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
          accent="bg-amber-50 text-amber-600"
        />
        <MetricCard
          title="Total Orders"
          value={metrics.totalOrders.toLocaleString()}
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
          accent="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Charts */}
      <Suspense fallback={<div className="h-80 bg-white rounded-xl border border-slate-200 animate-pulse" />}>
        <DashboardCharts chartData={chartData} orders={orders} />
      </Suspense>
    </div>
  );
}

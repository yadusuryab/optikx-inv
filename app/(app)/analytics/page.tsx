// app/(app)/analytics/page.tsx
import { getAllOrders } from '@/app/actions/orders';
import { getExpenses } from '@/app/actions/expenses';
import { getProducts } from '@/app/actions/products';
import {
  calculateDashboardMetrics,
  calculateProductAnalytics,
  buildRevenueChartData,
  formatCurrency,
  getDateRange,
} from '@/lib/calculations';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const range = params.range ?? 'month';

  // Resolve date range
  let fromDate = params.from;
  let toDate = params.to;
  if (!fromDate && !toDate && range !== 'all') {
    const dr = getDateRange(range);
    fromDate = dr.from;
    toDate = dr.to;
  }

  const [orders, expenses, products] = await Promise.all([
    getAllOrders(fromDate, toDate),
    getExpenses(fromDate, toDate),
    getProducts(),
  ]);

  const metrics = calculateDashboardMetrics(orders, expenses);
  const productAnalytics = calculateProductAnalytics(orders, expenses, products);
  const chartData = buildRevenueChartData(orders, expenses);

  return (
    <AnalyticsClient
      metrics={metrics}
      productAnalytics={productAnalytics}
      chartData={chartData}
      currentRange={range}
      products={products}
    />
  );
}

'use client';

// app/(app)/analytics/AnalyticsClient.tsx
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Legend, LineChart, Line,
} from 'recharts';
import { exportAnalyticsCsv } from '@/lib/export';
import { formatCurrency } from '@/lib/calculations';
import { PageHeader, Button, Badge, Table, Th, Td } from '@/components/ui';
import type { DashboardMetrics, ProductAnalytics, RevenueChartData, Product } from '@/types';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 days' },
  { value: 'month', label: '30 days' },
  { value: 'quarter', label: '90 days' },
  { value: 'year', label: '1 year' },
  { value: 'all', label: 'All time' },
];

const fmt = (v: number) => `$${(v / 1000).toFixed(1)}k`;

export default function AnalyticsClient({
  metrics,
  productAnalytics,
  chartData,
  currentRange,
  products,
}: {
  metrics: DashboardMetrics;
  productAnalytics: ProductAnalytics[];
  chartData: RevenueChartData[];
  currentRange: string;
  products: Product[];
}) {
  const router = useRouter();

  function setRange(range: string) {
    router.push(`/analytics?range=${range}`);
  }

  const sortedProducts = [...productAnalytics].sort((a, b) => b.totalRevenue - a.totalRevenue);

  // P&L summary table data
  const plRows = [
    { label: 'Gross Revenue', value: metrics.totalRevenue, type: 'positive' },
    { label: 'Cost of Goods Sold', value: -metrics.totalCost, type: 'negative' },
    { label: 'Gross Profit', value: metrics.grossProfit, type: metrics.grossProfit >= 0 ? 'positive' : 'negative', bold: true },
    { label: 'Operating Expenses', value: -metrics.totalExpenses, type: 'negative' },
    { label: 'Net Profit', value: metrics.netProfit, type: metrics.netProfit >= 0 ? 'positive' : 'negative', bold: true, highlight: true },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Analytics"
        description="Profit & loss, product performance, marketing ROI"
        action={
          <Button variant="secondary" size="sm" onClick={() => exportAnalyticsCsv(productAnalytics)}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </Button>
        }
      />

      {/* Date range selector */}
      <div className="flex gap-1.5 mb-8 bg-slate-100 p-1 rounded-lg w-fit">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
              currentRange === r.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Profit & Loss</h2>
          <div className="space-y-2">
            {plRows.map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between py-2 ${
                  row.highlight
                    ? 'bg-slate-50 rounded-lg px-3 -mx-3 border-t border-slate-200 mt-2 pt-3'
                    : ''
                }`}
              >
                <span className={`text-sm ${row.bold ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                  {row.label}
                </span>
                <span className={`text-sm font-mono ${
                  row.bold ? 'font-semibold' : 'font-medium'
                } ${
                  row.type === 'positive' ? 'text-green-700' : row.type === 'negative' ? 'text-red-600' : 'text-slate-700'
                }`}>
                  {formatCurrency(Math.abs(row.value))}
                  {row.value < 0 && <span className="text-xs ml-0.5 opacity-60">(cost)</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Margin summary */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
            {metrics.totalRevenue > 0 && (
              <>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Gross margin</span>
                  <span className="font-medium">{((metrics.grossProfit / metrics.totalRevenue) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Net margin</span>
                  <span className="font-medium">{((metrics.netProfit / metrics.totalRevenue) * 100).toFixed(1)}%</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-xs text-slate-500">
              <span>Total orders</span>
              <span className="font-medium">{metrics.totalOrders}</span>
            </div>
          </div>
        </div>

        {/* Revenue trend chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Profit Trend</h2>
          {chartData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#16a34a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Product performance table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Product Performance</h2>
          <span className="text-xs text-slate-400">Marketing costs allocated by units sold</span>
        </div>

        {sortedProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            No sales data for this period
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Units Sold</Th>
                <Th>Revenue</Th>
                <Th>COGS</Th>
                <Th>Gross Profit</Th>
                <Th>Marketing Alloc.</Th>
                <Th>Net Profit</Th>
                <Th>Net Margin</Th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((p) => {
                const netMargin = p.totalRevenue > 0
                  ? (p.netProfit / p.totalRevenue) * 100
                  : 0;
                return (
                  <tr key={p.product_id} className="hover:bg-slate-50 transition-colors">
                    <Td>
                      <div>
                        <span className="font-medium text-slate-900">{p.name}</span>
                        {p.sku && <span className="ml-2 text-xs text-slate-400 font-mono">{p.sku}</span>}
                      </div>
                    </Td>
                    <Td>{p.totalQuantitySold}</Td>
                    <Td className="font-medium">{formatCurrency(p.totalRevenue)}</Td>
                    <Td className="text-slate-500">{formatCurrency(p.totalCost)}</Td>
                    <Td>
                      <Badge variant={p.grossProfit >= 0 ? 'success' : 'danger'}>
                        {formatCurrency(p.grossProfit)}
                      </Badge>
                    </Td>
                    <Td className="text-slate-500">
                      {p.marketingCostAllocated > 0 ? formatCurrency(p.marketingCostAllocated) : '—'}
                    </Td>
                    <Td>
                      <span className={`font-semibold ${p.netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {formatCurrency(p.netProfit)}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant={netMargin > 20 ? 'success' : netMargin > 0 ? 'warning' : 'danger'}>
                        {netMargin.toFixed(1)}%
                      </Badge>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>

      {/* Revenue by product bar chart */}
      {sortedProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Revenue vs Profit by Product</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={sortedProducts.slice(0, 8).map((p) => ({
                name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
                Revenue: p.totalRevenue,
                Profit: p.netProfit,
                Cost: p.totalCost,
              }))}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Cost" fill="#fca5a5" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Profit" fill="#4ade80" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

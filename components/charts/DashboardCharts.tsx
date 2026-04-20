'use client';

// components/charts/DashboardCharts.tsx
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import type { RevenueChartData, Order } from '@/types';
import { formatCurrency } from '@/lib/calculations';

// Top products derived client-side
function getTopProducts(orders: Order[], n = 5) {
  const map = new Map<string, { name: string; revenue: number; quantity: number }>();
  for (const o of orders) {
    const name = o.products?.name ?? 'Unknown';
    const prev = map.get(o.product_id) ?? { name, revenue: 0, quantity: 0 };
    prev.revenue += o.selling_price * o.quantity;
    prev.quantity += o.quantity;
    map.set(o.product_id, prev);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, n);
}

const fmt = (v: number) => `$${(v / 1000).toFixed(1)}k`;

export default function DashboardCharts({
  chartData,
  orders,
}: {
  chartData: RevenueChartData[];
  orders: Order[];
}) {
  const topProducts = getTopProducts(orders);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Revenue vs Expenses area chart */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Revenue vs Expenses</h2>
        {chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" fill="url(#expGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top products bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Top Products</h2>
        {topProducts.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No orders yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} width={72} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// lib/calculations.ts
// Core profit & loss calculation functions

import type {
  Order,
  Expense,
  Product,
  DashboardMetrics,
  ProductAnalytics,
  RevenueChartData,
  TopProductData,
} from '@/types';

// ============================================================
// ORDER-LEVEL CALCULATIONS
// ============================================================

/** Gross profit for a single order line */
export function orderProfit(order: Order): number {
  return (order.selling_price - order.cost_price) * order.quantity;
}

/** Revenue for a single order line */
export function orderRevenue(order: Order): number {
  return order.selling_price * order.quantity;
}

/** Cost for a single order line */
export function orderCost(order: Order): number {
  return order.cost_price * order.quantity;
}

// ============================================================
// DASHBOARD METRICS
// ============================================================

export function calculateDashboardMetrics(
  orders: Order[],
  expenses: Expense[]
): DashboardMetrics {
  const totalRevenue = orders.reduce((sum, o) => sum + orderRevenue(o), 0);
  const totalCost = orders.reduce((sum, o) => sum + orderCost(o), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalExpenses;

  return {
    totalRevenue,
    totalCost,
    totalExpenses,
    netProfit,
    grossProfit,
    totalOrders: orders.length,
  };
}

// ============================================================
// MARKETING COST ALLOCATION
// ============================================================

/**
 * Distributes marketing expenses across products.
 * Two methods:
 *  - 'equal': split equally across unique products sold
 *  - 'units': weighted by quantity sold
 */
export function allocateMarketingCosts(
  orders: Order[],
  expenses: Expense[],
  method: 'equal' | 'units' = 'units'
): Map<string, number> {
  const marketingTotal = expenses
    .filter((e) => e.category === 'marketing' || e.category === 'ads')
    .reduce((sum, e) => sum + e.amount, 0);

  const allocation = new Map<string, number>();

  if (marketingTotal === 0) return allocation;

  // Group orders by product_id
  const productUnits = new Map<string, number>();
  for (const order of orders) {
    const prev = productUnits.get(order.product_id) ?? 0;
    productUnits.set(order.product_id, prev + order.quantity);
  }

  const uniqueProducts = [...productUnits.keys()];

  if (method === 'equal') {
    // Equal split across all products that had sales
    const perProduct = marketingTotal / uniqueProducts.length;
    uniqueProducts.forEach((pid) => allocation.set(pid, perProduct));
  } else {
    // Weighted by units sold
    const totalUnits = [...productUnits.values()].reduce((a, b) => a + b, 0);
    productUnits.forEach((units, pid) => {
      allocation.set(pid, (units / totalUnits) * marketingTotal);
    });
  }

  return allocation;
}

// ============================================================
// PRODUCT ANALYTICS
// ============================================================

export function calculateProductAnalytics(
  orders: Order[],
  expenses: Expense[],
  products: Product[]
): ProductAnalytics[] {
  const marketingAllocation = allocateMarketingCosts(orders, expenses, 'units');

  // Group orders by product
  const byProduct = new Map<string, Order[]>();
  for (const order of orders) {
    const existing = byProduct.get(order.product_id) ?? [];
    existing.push(order);
    byProduct.set(order.product_id, existing);
  }

  return products.map((product) => {
    const productOrders = byProduct.get(product.id) ?? [];
    const totalQuantitySold = productOrders.reduce((s, o) => s + o.quantity, 0);
    const totalRevenue = productOrders.reduce((s, o) => s + orderRevenue(o), 0);
    const totalCost = productOrders.reduce((s, o) => s + orderCost(o), 0);
    const grossProfit = totalRevenue - totalCost;
    const marketingCostAllocated = marketingAllocation.get(product.id) ?? 0;
    const netProfit = grossProfit - marketingCostAllocated;

    return {
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      totalQuantitySold,
      totalRevenue,
      totalCost,
      grossProfit,
      marketingCostAllocated,
      netProfit,
    };
  });
}

// ============================================================
// CHART DATA
// ============================================================

/** Groups orders and expenses by date for chart rendering */
export function buildRevenueChartData(
  orders: Order[],
  expenses: Expense[]
): RevenueChartData[] {
  const dataMap = new Map<
    string,
    { revenue: number; expenses: number; profit: number }
  >();

  for (const order of orders) {
    const existing = dataMap.get(order.date) ?? {
      revenue: 0,
      expenses: 0,
      profit: 0,
    };
    existing.revenue += orderRevenue(order);
    existing.profit += orderProfit(order);
    dataMap.set(order.date, existing);
  }

  for (const expense of expenses) {
    const existing = dataMap.get(expense.date) ?? {
      revenue: 0,
      expenses: 0,
      profit: 0,
    };
    existing.expenses += expense.amount;
    dataMap.set(expense.date, existing);
  }

  return [...dataMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }));
}

/** Top N products by revenue */
export function getTopProducts(
  analytics: ProductAnalytics[],
  n = 5
): TopProductData[] {
  return [...analytics]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, n)
    .map((p) => ({
      name: p.name,
      revenue: p.totalRevenue,
      quantity: p.totalQuantitySold,
    }));
}

// ============================================================
// DATE FILTER HELPERS
// ============================================================

export function getDateRange(range: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  let from: Date;

  switch (range) {
    case 'today':
      from = new Date(now);
      break;
    case 'week':
      from = new Date(now);
      from.setDate(from.getDate() - 7);
      break;
    case 'month':
      from = new Date(now);
      from.setMonth(from.getMonth() - 1);
      break;
    case 'quarter':
      from = new Date(now);
      from.setMonth(from.getMonth() - 3);
      break;
    case 'year':
      from = new Date(now);
      from.setFullYear(from.getFullYear() - 1);
      break;
    default:
      from = new Date('2000-01-01');
  }

  return { from: from.toISOString().split('T')[0], to };
}

// ============================================================
// FORMATTING UTILITIES
// ============================================================

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

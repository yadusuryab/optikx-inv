// ============================================================
// CORE DATABASE TYPES
// ============================================================

export interface Product {
  id: string;
  user_id: string;
  name: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  sku?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  selling_price: number;
  cost_price: number;      // snapshot at sale time
  date: string;
  created_at: string;
  // Joined product data (from queries)
  products?: Pick<Product, 'name' | 'sku'>;
}

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'marketing'
  | 'operations'
  | 'ads'
  | 'logistics'
  | 'other';

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface DashboardMetrics {
  totalRevenue: number;
  totalCost: number;
  totalExpenses: number;
  netProfit: number;
  totalOrders: number;
  grossProfit: number;
}

export interface ProductAnalytics {
  product_id: string;
  name: string;
  sku?: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marketingCostAllocated: number;
  netProfit: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface TopProductData {
  name: string;
  revenue: number;
  quantity: number;
}

// ============================================================
// FORM TYPES
// ============================================================

export interface ProductFormData {
  name: string;
  cost_price: string;
  selling_price: string;
  quantity: string;
  sku?: string;
}

export interface OrderFormData {
  product_id: string;
  quantity: string;
  selling_price: string;
  date: string;
}

export interface ExpenseFormData {
  title: string;
  amount: string;
  category: ExpenseCategory;
  date: string;
}

// ============================================================
// DATE FILTER TYPES
// ============================================================

export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface DateFilter {
  from?: string;
  to?: string;
  range: DateRange;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

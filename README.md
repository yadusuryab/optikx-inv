# LedgerFlow — Accounting & Inventory SaaS

A production-ready accounting and inventory management SaaS built with Next.js 15, Supabase, and Tailwind CSS.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Backend | Next.js Server Actions |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Charts | Recharts |
| Deployment | Vercel |

---

## Features

- **Authentication** — Email/password sign-up, sign-in, protected routes
- **Products** — Full CRUD, auto margin calculation, low-stock alerts
- **Orders** — Manual order entry, auto cost snapshot, stock decrement
- **Expenses** — Categorized expense tracking (marketing, ops, ads, logistics)
- **Analytics** — P&L statement, product performance, marketing cost allocation
- **Dashboard** — Revenue/expense/profit metrics, charts, low-stock notifications
- **Export** — CSV export for orders, expenses, analytics
- **Multi-tenant** — Row Level Security isolates each user's data completely

---

## Project Structure

```
saas-app/
├── app/
│   ├── (app)/                  # Protected app routes (sidebar layout)
│   │   ├── layout.tsx          # Auth guard + sidebar wrapper
│   │   ├── dashboard/page.tsx  # Metrics + charts
│   │   ├── products/           # Product CRUD
│   │   ├── orders/             # Order management + pagination
│   │   ├── expenses/           # Expense tracking
│   │   └── analytics/         # Full P&L + product analytics
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts  # OAuth/email callback
│   └── actions/               # Server Actions
│       ├── auth.ts
│       ├── products.ts
│       ├── orders.ts
│       └── expenses.ts
├── components/
│   ├── layout/Sidebar.tsx
│   ├── ui/index.tsx            # Reusable UI primitives
│   └── charts/                # Chart components
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── middleware.ts      # Session refresh
│   ├── calculations.ts        # P&L logic, metrics, chart data
│   └── export.ts              # CSV export utilities
├── types/index.ts              # TypeScript types
├── middleware.ts               # Auth redirect middleware
└── supabase/schema.sql        # Full DB schema + RLS policies
```

---

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **anon public key** from Settings → API

### 2. Run Database Schema

1. Open Supabase Dashboard → SQL Editor
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

This creates:
- `products` table with RLS
- `orders` table with RLS
- `expenses` table with RLS
- All indexes and policies

### 3. Configure Auth (Email)

Supabase Auth is enabled by default. To configure:

1. Supabase Dashboard → Authentication → Settings
2. Set **Site URL** to your domain (e.g. `https://yourapp.vercel.app`)
3. Add redirect URL: `https://yourapp.vercel.app/auth/callback`

### 4. Clone and Configure Next.js

```bash
# Clone the repo
git clone <your-repo>
cd saas-app

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

### 6. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Or connect your GitHub repo directly in the Vercel dashboard.

---

## Adding Sample Data

After creating your first account:

1. Open Supabase SQL Editor
2. Copy the sample data block from `supabase/schema.sql` (commented out at the bottom)
3. Replace `YOUR_USER_ID` with your user's UUID (find it in Supabase → Authentication → Users)
4. Run the query

---

## Key Calculations

### Profit Per Order
```
profit = (selling_price - cost_price) × quantity
```

### Dashboard Metrics
```
gross_revenue  = Σ (selling_price × quantity)
total_cost     = Σ (cost_price × quantity)
gross_profit   = gross_revenue - total_cost
total_expenses = Σ expenses.amount
net_profit     = gross_profit - total_expenses
```

### Marketing Cost Allocation (per product)
Distributed by units sold (weighted):
```
marketing_total   = Σ expenses WHERE category IN ('marketing', 'ads')
share             = product_units_sold / total_units_sold
allocated         = marketing_total × share
adjusted_profit   = gross_profit - allocated
```

---

## Security

- All tables use **Row Level Security** — users only see their own data
- `user_id` is set server-side from `auth.uid()` — never trusted from client
- Server Actions validate session before every write
- Protected routes enforced at middleware level

---

## Customization

**Add a new expense category**: Edit `CATEGORIES` array in `ExpensesClient.tsx` and update the `ExpenseCategory` type in `types/index.ts`.

**Change low-stock threshold**: Edit `LOW_STOCK_THRESHOLD = 10` in `dashboard/page.tsx` and `products/ProductsClient.tsx`.

**Change page size**: Edit `PAGE_SIZE = 20` in `app/actions/orders.ts`.

**Add currency**: Pass `currency` param to `formatCurrency()` in `lib/calculations.ts`.

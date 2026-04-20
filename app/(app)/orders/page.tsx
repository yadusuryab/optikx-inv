// app/(app)/orders/page.tsx
import { getOrders } from '@/app/actions/orders';
import { getProducts } from '@/app/actions/products';
import OrdersClient from './OrdersClient';

export const dynamic = 'force-dynamic';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const [{ orders, count }, products] = await Promise.all([
    getOrders(page, params.from, params.to),
    getProducts(),
  ]);

  return (
    <OrdersClient
      initialOrders={orders}
      totalCount={count}
      currentPage={page}
      products={products}
      fromDate={params.from}
      toDate={params.to}
    />
  );
}

'use client';

// app/(app)/orders/OrdersClient.tsx
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder, deleteOrder, getAllOrders } from '@/app/actions/orders';
import { exportOrdersCsv } from '@/lib/export';
import { formatCurrency, orderProfit } from '@/lib/calculations';
import {
  PageHeader, Button, Modal, Input, Select, Badge,
  Table, Th, Td, EmptyState, Alert,
} from '@/components/ui';
import type { Order, Product, OrderFormData } from '@/types';

const PAGE_SIZE = 20;

const DEFAULT_FORM: OrderFormData = {
  product_id: '',
  quantity: '1',
  selling_price: '',
  date: new Date().toISOString().split('T')[0],
};

export default function OrdersClient({
  initialOrders,
  totalCount,
  currentPage,
  products,
  fromDate,
  toDate,
}: {
  initialOrders: Order[];
  totalCount: number;
  currentPage: number;
  products: Product[];
  fromDate?: string;
  toDate?: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [count, setCount] = useState(totalCount);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<OrderFormData>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Auto-fill selling price when product selected
  function handleProductChange(productId: string) {
    const product = products.find((p) => p.id === productId);
    setForm((f) => ({
      ...f,
      product_id: productId,
      selling_price: product ? String(product.selling_price) : '',
    }));
  }

  function handleChange(field: keyof OrderFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    setFormError('');
    if (!form.product_id) return setFormError('Select a product');
    if (!form.quantity || +form.quantity < 1) return setFormError('Quantity must be at least 1');
    if (!form.selling_price || isNaN(+form.selling_price)) return setFormError('Enter a valid price');

    startTransition(async () => {
      const result = await createOrder(form);
      if (!result.success) {
        setFormError(result.error ?? 'Something went wrong');
        return;
      }
      setModalOpen(false);
      setForm(DEFAULT_FORM);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this order?')) return;
    startTransition(async () => {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setCount((c) => c - 1);
    });
  }

  async function handleExport() {
    const all = await getAllOrders(fromDate, toDate);
    exportOrdersCsv(all);
  }

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Orders"
        description={`${count} total order${count !== 1 ? 's' : ''}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </Button>
            <Button onClick={() => { setForm(DEFAULT_FORM); setFormError(''); setModalOpen(true); }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New order
            </Button>
          </div>
        }
      />

      {/* Date filter */}
      <div className="flex gap-3 mb-5">
        <input
          type="date"
          defaultValue={fromDate}
          onChange={(e) => {
            const url = new URL(window.location.href);
            url.searchParams.set('from', e.target.value);
            url.searchParams.set('page', '1');
            router.push(url.toString());
          }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="flex items-center text-slate-400 text-sm">to</span>
        <input
          type="date"
          defaultValue={toDate}
          onChange={(e) => {
            const url = new URL(window.location.href);
            url.searchParams.set('to', e.target.value);
            url.searchParams.set('page', '1');
            router.push(url.toString());
          }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {(fromDate || toDate) && (
          <Button variant="ghost" size="sm" onClick={() => router.push('/orders')}>
            Clear
          </Button>
        )}
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Record your first sale" action={<Button onClick={() => setModalOpen(true)}>New order</Button>} />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Product</Th>
                <Th>Qty</Th>
                <Th>Sell Price</Th>
                <Th>Cost</Th>
                <Th>Revenue</Th>
                <Th>Profit</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const profit = orderProfit(o);
                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <Td>
                      <span className="font-mono text-xs text-slate-500">{o.date}</span>
                    </Td>
                    <Td>
                      <span className="font-medium text-slate-900">{o.products?.name ?? '—'}</span>
                      {o.products?.sku && (
                        <span className="ml-2 text-xs text-slate-400 font-mono">{o.products.sku}</span>
                      )}
                    </Td>
                    <Td>{o.quantity}</Td>
                    <Td>{formatCurrency(o.selling_price)}</Td>
                    <Td className="text-slate-500">{formatCurrency(o.cost_price)}</Td>
                    <Td className="font-medium">{formatCurrency(o.selling_price * o.quantity)}</Td>
                    <Td>
                      <Badge variant={profit >= 0 ? 'success' : 'danger'}>
                        {formatCurrency(profit)}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(o.id)} className="text-red-500 hover:bg-red-50">
                        Delete
                      </Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('page', String(currentPage - 1));
                    router.push(url.toString());
                  }}
                >
                  ← Prev
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('page', String(currentPage + 1));
                    router.push(url.toString());
                  }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Order Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New order">
        <div className="space-y-4">
          {formError && <Alert message={formError} type="error" />}

          <Select
            label="Product *"
            value={form.product_id}
            onChange={(e) => handleProductChange(e.target.value)}
          >
            <option value="">Select a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                {p.name} {p.sku ? `(${p.sku})` : ''} — {p.quantity} in stock
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity *"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
            />
            <Input
              label="Selling price *"
              type="number"
              min="0"
              step="0.01"
              value={form.selling_price}
              onChange={(e) => handleChange('selling_price', e.target.value)}
            />
          </div>

          <Input
            label="Date *"
            type="date"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />

          {/* Profit preview */}
          {form.product_id && form.quantity && form.selling_price && (() => {
            const product = products.find((p) => p.id === form.product_id);
            if (!product) return null;
            const profit = (+form.selling_price - product.cost_price) * +form.quantity;
            const revenue = +form.selling_price * +form.quantity;
            return (
              <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600 space-y-0.5">
                <div>Revenue: <strong>{formatCurrency(revenue)}</strong></div>
                <div>Cost snapshot: <strong>{formatCurrency(product.cost_price * +form.quantity)}</strong></div>
                <div className={profit >= 0 ? 'text-green-700' : 'text-red-700'}>
                  Profit: <strong>{formatCurrency(profit)}</strong>
                </div>
              </div>
            );
          })()}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} loading={isPending} className="flex-1">Create order</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use client';

// app/(app)/products/ProductsClient.tsx
import { useState, useTransition } from 'react';
import { createProduct, updateProduct, deleteProduct } from '@/app/actions/products';
import { PageHeader, Button, Modal, Input, Badge, Table, Th, Td, EmptyState, Alert } from '@/components/ui';
import { formatCurrency } from '@/lib/calculations';
import type { Product, ProductFormData } from '@/types';

const DEFAULT_FORM: ProductFormData = {
  name: '',
  cost_price: '',
  selling_price: '',
  quantity: '',
  sku: '',
};

const LOW_STOCK = 10;

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditProduct(null);
    setForm(DEFAULT_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({
      name: p.name,
      cost_price: String(p.cost_price),
      selling_price: String(p.selling_price),
      quantity: String(p.quantity),
      sku: p.sku ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  function handleChange(field: keyof ProductFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    setFormError('');

    if (!form.name.trim()) return setFormError('Name is required');
    if (!form.cost_price || isNaN(+form.cost_price)) return setFormError('Valid cost price required');
    if (!form.selling_price || isNaN(+form.selling_price)) return setFormError('Valid selling price required');
    if (!form.quantity || isNaN(+form.quantity) || +form.quantity < 0) return setFormError('Valid quantity required');

    startTransition(async () => {
      const result = editProduct
        ? await updateProduct(editProduct.id, form)
        : await createProduct(form);

      if (!result.success) {
        setFormError(result.error ?? 'Something went wrong');
        return;
      }

      // Optimistically update local state
      if (editProduct && result.data) {
        setProducts((prev) => prev.map((p) => p.id === editProduct.id ? result.data! : p));
      } else if (result.data) {
        setProducts((prev) => [result.data!, ...prev]);
      }

      setModalOpen(false);
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    });
  }

  const margin = (p: Product) =>
    p.selling_price > 0
      ? (((p.selling_price - p.cost_price) / p.selling_price) * 100).toFixed(1)
      : '0';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Products"
        description="Manage your inventory"
        action={
          <Button onClick={openCreate}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add product
          </Button>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first product to get started"
          action={<Button onClick={openCreate}>Add product</Button>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>SKU</Th>
              <Th>Cost</Th>
              <Th>Price</Th>
              <Th>Margin</Th>
              <Th>Stock</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <Td>
                  <span className="font-medium text-slate-900">{p.name}</span>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-slate-500">{p.sku || '—'}</span>
                </Td>
                <Td>{formatCurrency(p.cost_price)}</Td>
                <Td>{formatCurrency(p.selling_price)}</Td>
                <Td>
                  <Badge variant={+margin(p) > 30 ? 'success' : +margin(p) > 0 ? 'warning' : 'danger'}>
                    {margin(p)}%
                  </Badge>
                </Td>
                <Td>
                  <span className={p.quantity <= LOW_STOCK ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                    {p.quantity}
                    {p.quantity <= LOW_STOCK && (
                      <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Low</span>
                    )}
                  </span>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-500 hover:bg-red-50">Delete</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? 'Edit product' : 'New product'}
      >
        <div className="space-y-4">
          {formError && <Alert message={formError} type="error" />}

          <Input
            label="Product name *"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Widget Pro"
          />

          <Input
            label="SKU (optional)"
            value={form.sku}
            onChange={(e) => handleChange('sku', e.target.value)}
            placeholder="e.g. WGT-001"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cost price *"
              type="number"
              min="0"
              step="0.01"
              value={form.cost_price}
              onChange={(e) => handleChange('cost_price', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Selling price *"
              type="number"
              min="0"
              step="0.01"
              value={form.selling_price}
              onChange={(e) => handleChange('selling_price', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <Input
            label="Quantity in stock *"
            type="number"
            min="0"
            value={form.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="0"
          />

          {/* Live margin preview */}
          {form.cost_price && form.selling_price && (
            <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600">
              Margin:{' '}
              <strong>
                {+form.selling_price > 0
                  ? ((( +form.selling_price - +form.cost_price) / +form.selling_price) * 100).toFixed(1)
                  : 0}%
              </strong>
              {' '}· Profit per unit:{' '}
              <strong>{formatCurrency(+form.selling_price - +form.cost_price)}</strong>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={isPending} className="flex-1">
              {editProduct ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

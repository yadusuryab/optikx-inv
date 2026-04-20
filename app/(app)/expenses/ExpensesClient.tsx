'use client';

// app/(app)/expenses/ExpensesClient.tsx
import { useState, useTransition } from 'react';
import { createExpense, updateExpense, deleteExpense } from '@/app/actions/expenses';
import { exportExpensesCsv } from '@/lib/export';
import { formatCurrency } from '@/lib/calculations';
import {
  PageHeader, Button, Modal, Input, Select, Badge,
  Table, Th, Td, EmptyState, Alert,
} from '@/components/ui';
import type { Expense, ExpenseFormData, ExpenseCategory } from '@/types';

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'operations', label: 'Operations' },
  { value: 'ads', label: 'Advertising' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_VARIANTS: Record<ExpenseCategory, 'info' | 'warning' | 'danger' | 'default' | 'success'> = {
  marketing: 'info',
  ads: 'warning',
  operations: 'default',
  logistics: 'success',
  other: 'default',
};

const DEFAULT_FORM: ExpenseFormData = {
  title: '',
  amount: '',
  category: 'operations',
  date: new Date().toISOString().split('T')[0],
};

export default function ExpensesClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseFormData>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditExpense(null);
    setForm(DEFAULT_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(e: Expense) {
    setEditExpense(e);
    setForm({ title: e.title, amount: String(e.amount), category: e.category, date: e.date });
    setFormError('');
    setModalOpen(true);
  }

  function handleChange(field: keyof ExpenseFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    setFormError('');
    if (!form.title.trim()) return setFormError('Title is required');
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) return setFormError('Enter a valid amount');

    startTransition(async () => {
      const result = editExpense
        ? await updateExpense(editExpense.id, form)
        : await createExpense(form);

      if (!result.success) {
        setFormError(result.error ?? 'Something went wrong');
        return;
      }

      if (editExpense && result.data) {
        setExpenses((prev) => prev.map((e) => e.id === editExpense.id ? result.data! : e));
      } else if (result.data) {
        setExpenses((prev) => [result.data!, ...prev]);
      }

      setModalOpen(false);
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    startTransition(async () => {
      const result = await deleteExpense(id);
      if (result.success) setExpenses((prev) => prev.filter((e) => e.id !== id));
    });
  }

  const filtered = filterCategory === 'all'
    ? expenses
    : expenses.filter((e) => e.category === filterCategory);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  // Category breakdown
  const byCategory = CATEGORIES.map(({ value, label }) => ({
    label,
    value,
    total: expenses.filter((e) => e.category === value).reduce((s, e) => s + e.amount, 0),
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Expenses"
        description={`${expenses.length} total · ${formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))} spent`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => exportExpensesCsv(expenses)}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </Button>
            <Button onClick={openCreate}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add expense
            </Button>
          </div>
        }
      />

      {/* Category summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {byCategory.map(({ label, value, total: catTotal }) => (
          <button
            key={value}
            onClick={() => setFilterCategory(filterCategory === value ? 'all' : value)}
            className={`text-left p-3 rounded-xl border transition-all ${
              filterCategory === value
                ? 'border-blue-300 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatCurrency(catTotal)}</p>
          </button>
        ))}
      </div>

      {/* Filter indicator */}
      {filterCategory !== 'all' && (
        <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
          <span>Filtering by <strong>{CATEGORIES.find(c => c.value === filterCategory)?.label}</strong></span>
          <span>·</span>
          <span>{formatCurrency(total)} total</span>
          <button onClick={() => setFilterCategory('all')} className="text-blue-600 hover:underline ml-1">Clear</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No expenses"
          description={filterCategory !== 'all' ? 'No expenses in this category' : 'Add your first expense'}
          action={filterCategory === 'all' ? <Button onClick={openCreate}>Add expense</Button> : undefined}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Amount</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                <Td><span className="font-mono text-xs text-slate-500">{e.date}</span></Td>
                <Td><span className="font-medium text-slate-900">{e.title}</span></Td>
                <Td>
                  <Badge variant={CATEGORY_VARIANTS[e.category]}>
                    {CATEGORIES.find(c => c.value === e.category)?.label ?? e.category}
                  </Badge>
                </Td>
                <Td><span className="font-semibold text-slate-800">{formatCurrency(e.amount)}</span></Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)} className="text-red-500 hover:bg-red-50">Delete</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editExpense ? 'Edit expense' : 'Add expense'}>
        <div className="space-y-4">
          {formError && <Alert message={formError} type="error" />}

          <Input
            label="Title *"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g. Google Ads Campaign"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount *"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="0.00"
            />
            <Select
              label="Category *"
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>

          <Input
            label="Date *"
            type="date"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} loading={isPending} className="flex-1">
              {editExpense ? 'Save changes' : 'Add expense'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use server';

// app/actions/expenses.ts
// Server actions for expense tracking

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, Expense, ExpenseFormData } from '@/types';

// ============================================================
// READ
// ============================================================

export async function getExpenses(
  fromDate?: string,
  toDate?: string
): Promise<Expense[]> {
  const supabase = await createClient();

  let query = supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (fromDate) query = query.gte('date', fromDate);
  if (toDate) query = query.lte('date', toDate);

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

// ============================================================
// CREATE
// ============================================================

export async function createExpense(
  formData: ExpenseFormData
): Promise<ActionResult<Expense>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      title: formData.title.trim(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/expenses');
  revalidatePath('/dashboard');
  revalidatePath('/analytics');
  return { success: true, data };
}

// ============================================================
// UPDATE
// ============================================================

export async function updateExpense(
  id: string,
  formData: ExpenseFormData
): Promise<ActionResult<Expense>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('expenses')
    .update({
      title: formData.title.trim(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/expenses');
  revalidatePath('/dashboard');
  revalidatePath('/analytics');
  return { success: true, data };
}

// ============================================================
// DELETE
// ============================================================

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/expenses');
  revalidatePath('/dashboard');
  revalidatePath('/analytics');
  return { success: true };
}

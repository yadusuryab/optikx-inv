'use server';

// app/actions/orders.ts
// Server actions for order management

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { decrementStock } from './products';
import type { ActionResult, Order, OrderFormData } from '@/types';

const PAGE_SIZE = 20;

// ============================================================
// READ (with pagination + date filter)
// ============================================================

export async function getOrders(
  page = 1,
  fromDate?: string,
  toDate?: string
): Promise<{ orders: Order[]; count: number }> {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('orders')
    .select('*, products(name, sku)', { count: 'exact' })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (fromDate) query = query.gte('date', fromDate);
  if (toDate) query = query.lte('date', toDate);

  const { data, error, count } = await query;

  if (error) {
    console.error('getOrders error:', error);
    return { orders: [], count: 0 };
  }

  return { orders: (data as Order[]) ?? [], count: count ?? 0 };
}

/** Fetch ALL orders (no pagination) for analytics / exports */
export async function getAllOrders(
  fromDate?: string,
  toDate?: string
): Promise<Order[]> {
  const supabase = await createClient();

  let query = supabase
    .from('orders')
    .select('*, products(name, sku)')
    .order('date', { ascending: false });

  if (fromDate) query = query.gte('date', fromDate);
  if (toDate) query = query.lte('date', toDate);

  const { data, error } = await query;
  if (error) return [];
  return (data as Order[]) ?? [];
}

// ============================================================
// CREATE (with stock decrement)
// ============================================================

export async function createOrder(
  formData: OrderFormData
): Promise<ActionResult<Order>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const qty = parseInt(formData.quantity, 10);
  const sellingPrice = parseFloat(formData.selling_price);

  // Fetch product to snapshot cost_price at sale time
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('cost_price, quantity, name')
    .eq('id', formData.product_id)
    .single();

  if (productError || !product)
    return { success: false, error: 'Product not found' };

  if (product.quantity < qty)
    return {
      success: false,
      error: `Insufficient stock. Available: ${product.quantity}`,
    };

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      product_id: formData.product_id,
      quantity: qty,
      selling_price: sellingPrice,
      cost_price: product.cost_price, // snapshot
      date: formData.date,
    })
    .select()
    .single();

  if (orderError) return { success: false, error: orderError.message };

  // Decrement stock
  const stockResult = await decrementStock(formData.product_id, qty);
  if (!stockResult.success) {
    // Rollback order
    await supabase.from('orders').delete().eq('id', order.id);
    return { success: false, error: stockResult.error };
  }

  revalidatePath('/orders');
  revalidatePath('/products');
  revalidatePath('/dashboard');
  revalidatePath('/analytics');
  return { success: true, data: order };
}

// ============================================================
// DELETE
// ============================================================

export async function deleteOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/orders');
  revalidatePath('/dashboard');
  revalidatePath('/analytics');
  return { success: true };
}

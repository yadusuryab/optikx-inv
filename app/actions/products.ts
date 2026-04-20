'use server';

// app/actions/products.ts
// Server actions for product CRUD operations

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult, Product, ProductFormData } from '@/types';

// ============================================================
// READ
// ============================================================

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getProducts error:', error);
    return [];
  }

  return data ?? [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

// ============================================================
// CREATE
// ============================================================

export async function createProduct(
  formData: ProductFormData
): Promise<ActionResult<Product>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id: user.id,
      name: formData.name.trim(),
      cost_price: parseFloat(formData.cost_price),
      selling_price: parseFloat(formData.selling_price),
      quantity: parseInt(formData.quantity, 10),
      sku: formData.sku?.trim() || null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/products');
  revalidatePath('/dashboard');
  return { success: true, data };
}

// ============================================================
// UPDATE
// ============================================================

export async function updateProduct(
  id: string,
  formData: ProductFormData
): Promise<ActionResult<Product>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .update({
      name: formData.name.trim(),
      cost_price: parseFloat(formData.cost_price),
      selling_price: parseFloat(formData.selling_price),
      quantity: parseInt(formData.quantity, 10),
      sku: formData.sku?.trim() || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/products');
  revalidatePath('/dashboard');
  return { success: true, data };
}

// ============================================================
// DELETE
// ============================================================

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/products');
  revalidatePath('/dashboard');
  return { success: true };
}

// ============================================================
// STOCK UPDATE (internal use by order creation)
// ============================================================

export async function decrementStock(
  productId: string,
  quantity: number
): Promise<ActionResult> {
  const supabase = await createClient();

  // Fetch current quantity first (RLS ensures it's the user's product)
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('quantity')
    .eq('id', productId)
    .single();

  if (fetchError || !product)
    return { success: false, error: 'Product not found' };

  if (product.quantity < quantity)
    return {
      success: false,
      error: `Insufficient stock. Available: ${product.quantity}`,
    };

  const { error } = await supabase
    .from('products')
    .update({ quantity: product.quantity - quantity })
    .eq('id', productId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

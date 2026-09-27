import { supabase } from '../lib/supabase';
import { SkinType, ConcernTag } from '../verdict/types';
import type { IngredientConcern, Verdict } from '../verdict';

export async function getIngredientConcerns(): Promise<IngredientConcern[]> {
  const { data, error } = await supabase.from('ingredient_concerns')
    .select('ingredient_name, aliases, is_sensitivity_flag, helps_with, is_strong_active, is_barrier_support');
  if (error || !data?.length) throw new Error('Ingredient reference data is unavailable');
  return data;
}

export async function saveCheck(productId: string, verdict: Verdict): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sign in to save this check');
  const { error } = await supabase.from('checks').insert({
    user_id: user.id, product_id: productId, verdict: verdict.verdict,
    factors_json: { hard_constraints: verdict.hard_constraints, compatibility_factors: verdict.compatibility_factors },
  });
  if (error) throw new Error('Could not save this check');
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  ingredients_raw: string;
  ingredients_normalized: string[];
  unmatched_count: number;
  partial_data: boolean;
  skin_type_tags: SkinType[];
  concern_tags: ConcernTag[];
  age_notes: string | null;
  annotation_source: string | null;
  annotation_rationale: string | null;
  annotator: string | null;
  annotated_at: string | null;
  image_url: string | null;
}

export interface SearchResult {
  id: string;
  name: string;
  brand: string;
  image_url: string | null;
  skin_type_tags: SkinType[];
  concern_tags: ConcernTag[];
}

/**
 * Search products by name or brand (case-insensitive, partial match).
 * Returns lightweight results for the search list.
 */
export async function searchProducts(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, image_url, skin_type_tags, concern_tags')
    .or(`name.ilike.%${query.replace(/[,%()\\]/g, ' ').trim()}%,brand.ilike.%${query.replace(/[,%()\\]/g, ' ').trim()}%`)
    .order('name', { ascending: true })
    .limit(20);

  if (error) {
    console.error('searchProducts error:', error);
    throw new Error('Failed to search products');
  }

  return data ?? [];
}

/**
 * Get full product details by ID for verdict evaluation.
 */
export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('getProduct error:', error);
    throw new Error('Failed to load product');
  }

  return data;
}

/**
 * Get recent checks for the current user (for SearchScreen recent list).
 */
export async function getRecentChecks(userId: string, limit = 5): Promise<Array<{
  id: string;
  product_id: string;
  verdict: string;
  created_at: string;
  product: Pick<Product, 'id' | 'name' | 'brand' | 'image_url'>;
}>> {
  // Guests have no user_id: skip the query entirely. Passing '' to
  // .eq('user_id', ...) makes Postgres cast '' to uuid and throw 22P02.
  if (!userId?.trim()) return [];
  const { data, error } = await supabase
    .from('checks')
    .select(`
      id,
      product_id,
      verdict,
      created_at,
      product:products!inner (
        id,
        name,
        brand,
        image_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getRecentChecks error:', error);
    throw new Error('Could not load recent checks');
  }

  // Supabase returns product as array due to the join, but it's a single object
  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => {
    const product = item['product'] as
      | Pick<Product, 'id' | 'name' | 'brand' | 'image_url'>
      | Array<Pick<Product, 'id' | 'name' | 'brand' | 'image_url'>>;
    return {
      ...(item as { id: string; product_id: string; verdict: string; created_at: string }),
      product: Array.isArray(product) ? product[0] : product,
    };
  });
}

/**
 * Get full scan/check history for the current user (for HistoryScreen).
 * Returns paginated results ordered chronologically (newest first).
 */
export interface ScanHistoryItem {
  id: string;
  product_id: string;
  verdict: 'match' | 'caution' | 'mismatch';
  factors_json: {
    hard_constraints: Array<{ name: string; result: string }>;
    compatibility_factors: Array<{ name: string; result: string; reason: string }>;
  };
  created_at: string;
  product: Pick<Product, 'id' | 'name' | 'brand' | 'image_url'>;
}

export async function getScanHistory(
  userId: string,
  limit = 50,
  offset = 0
): Promise<ScanHistoryItem[]> {
  // Same guest guard as getRecentChecks: empty user_id must short-circuit
  // to [] instead of reaching Postgres ('' is not a valid uuid).
  if (!userId?.trim()) return [];
  const { data, error } = await supabase
    .from('checks')
    .select(`
      id,
      product_id,
      verdict,
      factors_json,
      created_at,
      product:products!inner (
        id,
        name,
        brand,
        image_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('getScanHistory error:', error);
    throw new Error('Failed to load scan history');
  }

  // Supabase returns product as array due to the join, but it's a single object
  return ((data ?? []) as Array<Record<string, unknown>>).map((item) => {
    const product = item['product'] as
      | ScanHistoryItem['product']
      | Array<ScanHistoryItem['product']>;
    return {
      ...(item as unknown as ScanHistoryItem),
      product: Array.isArray(product) ? product[0] : product,
    };
  });
}

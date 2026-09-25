import { supabase } from '../lib/supabase';
import { SkinType, ConcernTag } from '../verdict/types';

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
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
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
    return [];
  }

  // Supabase returns product as array due to the join, but it's a single object
  return (data ?? []).map((item: any) => ({
    ...item,
    product: Array.isArray(item.product) ? item.product[0] : item.product,
  }));
}
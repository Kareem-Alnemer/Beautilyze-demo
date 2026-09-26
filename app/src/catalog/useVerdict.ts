import { useCallback, useEffect, useRef, useState } from 'react';
import { evaluate, type Profile, type Verdict } from '../verdict';
import { getProduct, getIngredientConcerns, type Product } from './api';

export function useVerdict(productId: string, profile: Profile) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const profileJson = JSON.stringify(profile);
  const refetch = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError(null);
    setProduct(null);
    setVerdict(null);
    try {
      const [record, concerns] = await Promise.all([getProduct(productId), getIngredientConcerns()]);
      if (request !== generation.current) return;
      if (!record) throw new Error('Product not found');
      setProduct(record);
      setVerdict(evaluate(JSON.parse(profileJson) as Profile, record, concerns));
    } catch (cause) {
      if (request === generation.current) setError(cause instanceof Error ? cause.message : 'Failed to check product');
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [productId, profileJson]);
  useEffect(() => {
    void refetch();
    return () => { generation.current++; };
  }, [refetch]);
  return { verdict, product, loading, error, refetch };
}

import { useEffect, useState } from 'react';
import { evaluate } from '../index';
import { getProduct } from '../../catalog/api';
import { Product } from '../../catalog/api';
import { Profile } from '../types';
import { Verdict } from '../types';

interface UseVerdictResult {
  verdict: Verdict | null;
  product: Product | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch a product and evaluate the verdict against the current profile.
 * The profile is passed in (from Zustand store) to keep this hook pure and testable.
 */
export function useVerdict(
  productId: string,
  profile: Profile
): UseVerdictResult {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndEvaluate = async () => {
    setLoading(true);
    setError(null);

    try {
      const productData = await getProduct(productId);
      if (!productData) {
        throw new Error('Product not found');
      }

      setProduct(productData);

      // Build the profile input for the verdict engine
      // Only user-set fields are used (per blueprint §5.3, §6.1)
      const verdictInput = {
        user_skin_type: profile.user_skin_type,
        user_acne_severity: profile.user_acne_severity,
        age: profile.age,
        allergies: profile.allergies,
        sensitivities: profile.sensitivities,
      };

      const result = evaluate(verdictInput, productData);
      setVerdict(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check product';
      setError(message);
      setVerdict(null);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndEvaluate();
  }, [productId, profile.user_skin_type, profile.user_acne_severity, profile.age, profile.allergies.join(','), profile.sensitivities.join(',')]);

  return {
    verdict,
    product,
    loading,
    error,
    refetch: fetchAndEvaluate,
  };
}
import { Profile, Product, FactorState } from '../types';

/**
 * Evaluates the skin-type fit compatibility factor.
 *
 * This is a compatibility factor (blueprint §6.2). It checks whether the
 * product is tagged as suitable for the user's skin type.
 *
 * Returns one of:
 * - 'pass' — product tagged suitable for user's skin type
 * - 'caution' — product has no skin-type tags (neutral)
 * - 'fail' — product has skin-type tags but user's type is not among them
 * - 'insufficient_data' — user's skin type not set
 *
 * Per blueprint §6.3 table and §6.5 step 5.
 */
export function evaluateSkinTypeFit(
  profile: Profile,
  product: Product
): FactorState {
  // If user hasn't set their skin type, we cannot evaluate.
  if (profile.user_skin_type === null) {
    return 'insufficient_data';
  }

  // If product has no skin-type tags, it's neutral (not targeted).
  if (!product.skin_type_tags || product.skin_type_tags.length === 0) {
    return 'caution';
  }

  // Product has skin-type tags. Check if user's type is among them.
  if (product.skin_type_tags.includes(profile.user_skin_type)) {
    return 'pass';
  }

  // Product targets specific skin types, but not the user's.
  return 'fail';
}
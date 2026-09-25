import { Profile, Product, FactorState } from '../types';

/**
 * Parsed age restriction from product age_notes.
 */
interface AgeRestriction {
  type: 'min' | 'max' | 'range' | 'qualitative';
  min?: number;
  max?: number;
  strength: 'strong' | 'mild';
  raw: string;
}

/**
 * Checks if text contains explicitly advisory (mild) language.
 */
function isMildLanguage(text: string): boolean {
  return /\b(?:ideal\s+for|best\s+for|suitable\s+for|teen.?friendly|mature\s+skin|anti.?aging|aging\s+skin)\b/.test(text);
}

/**
 * Parses age_notes string into structured restrictions.
 * Returns array of restrictions found (can be multiple).
 */
function parseAgeNotes(notes: string): AgeRestriction[] {
  const restrictions: AgeRestriction[] = [];
  const text = notes.toLowerCase().trim();

  if (!text) return restrictions;

  const mildLanguage = isMildLanguage(text);

  // Pattern: "18+", "ages 18+", "minimum age 18", "18 and up"
  // Use lookahead for whitespace, punctuation, or end of string after +
  const minMatch = text.match(/(?:^|\s)(?:ages?\s+)?(\d+)\s*\+(?=[\s,.;]|$)/);
  if (minMatch) {
    restrictions.push({
      type: 'min',
      min: parseInt(minMatch[1], 10),
      strength: mildLanguage ? 'mild' : 'strong',
      raw: minMatch[0].trim(),
    });
  }

  // Pattern: "under 30", "below 30", "max age 30", "up to 30"
  const maxMatch = text.match(/\b(?:under|below|max(?:imum)?\s+age|up\s+to)\s+(\d+)\b/);
  if (maxMatch) {
    restrictions.push({
      type: 'max',
      max: parseInt(maxMatch[1], 10),
      strength: mildLanguage ? 'mild' : 'strong',
      raw: maxMatch[0],
    });
  }

  // Pattern: "20-40", "20 to 40", "ages 20-40", "20–40"
  const rangeMatch = text.match(/\b(\d+)\s*[–-]\s*(\d+)\b/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    if (min < max) {
      restrictions.push({
        type: 'range',
        min,
        max,
        strength: mildLanguage ? 'mild' : 'strong',
        raw: rangeMatch[0],
      });
    }
  }

  // Pattern: "ages 20 40" (space separated)
  const spaceRangeMatch = text.match(/\bages?\s+(\d+)\s+(\d+)\b/);
  if (spaceRangeMatch && !rangeMatch) {
    const min = parseInt(spaceRangeMatch[1], 10);
    const max = parseInt(spaceRangeMatch[2], 10);
    if (min < max) {
      restrictions.push({
        type: 'range',
        min,
        max,
        strength: mildLanguage ? 'mild' : 'strong',
        raw: spaceRangeMatch[0],
      });
    }
  }

  // Qualitative: "adults only", "not for children" - strong
  if (/\b(?:adults?\s+only|not\s+for\s+children?|contraindicated\s+for\s+children?)\b/.test(text)) {
    restrictions.push({
      type: 'qualitative',
      min: 18,
      strength: 'strong',
      raw: 'adults only / not for children',
    });
  }

  // Qualitative: "teen", "teenager" - mild (advisory)
  if (/\b(?:teen|teenager|adolescent)\b/.test(text) && !/\b(?:not\s+for\s+teen|adults?\s+only)\b/.test(text)) {
    restrictions.push({
      type: 'qualitative',
      min: 13,
      max: 19,
      strength: 'mild',
      raw: 'teen',
    });
  }

  // Qualitative: "mature skin", "anti-aging" - mild (advisory)
  if (/\b(?:mature\s+skin|anti.?aging|aging\s+skin)\b/.test(text)) {
    restrictions.push({
      type: 'qualitative',
      min: 30,
      strength: 'mild',
      raw: 'mature skin',
    });
  }

  // Qualitative: "ideal for 20s", "best for 20s-30s" - mild (advisory)
  if (/\b(?:ideal\s+for|best\s+for|suitable\s+for)\s+\d+s?\b/.test(text)) {
    restrictions.push({
      type: 'qualitative',
      strength: 'mild',
      raw: 'ideal for age group',
    });
  }

  return restrictions;
}

/**
 * Evaluates a single restriction against user age.
 * Returns: 'pass' | 'fail' | 'caution' | null (not applicable)
 */
function evaluateRestriction(age: number, restriction: AgeRestriction): 'pass' | 'fail' | 'caution' | null {
  switch (restriction.type) {
    case 'min':
      if (age >= (restriction.min ?? 0)) return 'pass';
      return restriction.strength === 'strong' ? 'fail' : 'caution';

    case 'max':
      if (age <= (restriction.max ?? Infinity)) return 'pass';
      return restriction.strength === 'strong' ? 'fail' : 'caution';

    case 'range':
      if (age >= (restriction.min ?? 0) && age <= (restriction.max ?? Infinity)) return 'pass';
      return restriction.strength === 'strong' ? 'fail' : 'caution';

    case 'qualitative':
      // Mild qualitative restrictions are always caution (advisory only)
      if (restriction.strength === 'mild') {
        return 'caution';
      }
      // Strong qualitative (adults only, not for children)
      if (restriction.min !== undefined && restriction.max !== undefined) {
        if (age >= restriction.min && age <= restriction.max) return 'pass';
        return 'fail';
      }
      if (restriction.min !== undefined) {
        if (age >= restriction.min) return 'pass';
        return 'fail';
      }
      return 'caution';

    default:
      return null;
  }
}

/**
 * Evaluates the age fit compatibility factor.
 *
 * This is a compatibility factor (blueprint §6.2). It checks whether the
 * user's age falls within the product's age suitability range.
 *
 * Returns one of:
 * - 'pass' — no age note, or user within range
 * - 'caution' — mild age note, or user outside mild range
 * - 'fail' — strong age restriction user falls outside
 * - 'insufficient_data' — user's age not set
 *
 * Per blueprint §6.3 table.
 */
export function evaluateAgeFit(
  profile: Profile,
  product: Product
): FactorState {
  // If user hasn't set their age, we cannot evaluate.
  if (profile.age === null || profile.age <= 0) {
    return 'insufficient_data';
  }

  // If product has no age notes, no restriction.
  if (!product.age_notes || product.age_notes.trim() === '') {
    return 'pass';
  }

  const restrictions = parseAgeNotes(product.age_notes);

  // If no parseable restrictions, treat as no restriction.
  if (restrictions.length === 0) {
    return 'pass';
  }

  // Evaluate all restrictions. Strongest result wins:
  // fail > caution > pass
  let worstResult: 'pass' | 'caution' | 'fail' = 'pass';

  for (const restriction of restrictions) {
    const result = evaluateRestriction(profile.age, restriction);
    if (result === 'fail') return 'fail'; // Strong fail is immediate
    if (result === 'caution') worstResult = 'caution';
  }

  return worstResult;
}
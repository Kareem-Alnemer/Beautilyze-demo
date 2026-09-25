export type SkinType = 'dry' | 'normal' | 'oily';

export type AcneSeverity = 'mild' | 'moderate' | 'severe';

export type ConcernTag = 'acne' | 'oil_control' | 'hydration' | 'dryness' | 'sensitivity';

export type FactorState = 'pass' | 'caution' | 'fail' | 'insufficient_data';

export type VerdictValue = 'match' | 'caution' | 'mismatch';

export interface Profile {
  user_skin_type: SkinType | null;
  user_acne_severity: AcneSeverity | null;
  allergies: string[];
  sensitivities: string[];
  age: number | null;
  ai_skin_type?: SkinType | null;
  ai_acne_severity?: AcneSeverity | null;
  skin_type_confidence?: number | null;
  acne_severity_confidence?: number | null;
  model_version?: string | null;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  ingredients_normalized: string[];
  unmatched_count: number;
  partial_data: boolean;
  skin_type_tags: SkinType[];
  concern_tags: ConcernTag[];
  age_notes: string | null;
}

export interface FactorResult {
  name: string;
  result: FactorState;
  reason: string;
}

export interface HardConstraintResult {
  name: 'declared_allergen_conflict' | 'sensitivity';
  result: FactorState;
  reason: string;
}

export type CompatibilityFactors = [
  FactorResult,
  FactorResult,
  FactorResult
];

export interface Verdict {
  verdict: VerdictValue;
  score: {
    label: 'Compatibility factors';
    passed: number;
    total: 3;
  };
  hard_constraints: HardConstraintResult[];
  compatibility_factors: CompatibilityFactors;
  summary: string;
  disclaimer_shown: boolean;
}
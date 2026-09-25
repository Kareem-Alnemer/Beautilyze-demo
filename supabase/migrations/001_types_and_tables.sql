-- Migration 001: Custom types & core tables
-- Run order: 1st

-- Custom ENUM types (must be created before tables that reference them)
CREATE TYPE skin_type AS ENUM ('dry', 'normal', 'oily');
CREATE TYPE acne_severity AS ENUM ('mild', 'moderate', 'severe');
CREATE TYPE concern_tag AS ENUM ('acne', 'oil_control', 'hydration', 'dryness', 'sensitivity');

-- products table (catalog, public read)
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  ingredients_raw text NOT NULL,
  ingredients_normalized text[] NOT NULL DEFAULT '{}',
  unmatched_count int NOT NULL DEFAULT 0,
  partial_data boolean NOT NULL DEFAULT false,
  skin_type_tags skin_type[] NOT NULL DEFAULT '{}',
  concern_tags concern_tag[] NOT NULL DEFAULT '{}',
  age_notes text,
  annotation_source text,
  annotation_rationale text,
  annotator text,
  annotated_at timestamptz DEFAULT now()
);

-- ingredient_concerns table (lookup table, public read)
CREATE TABLE ingredient_concerns (
  ingredient_name text PRIMARY KEY,
  aliases text[] NOT NULL DEFAULT '{}',
  helps_with concern_tag[] NOT NULL DEFAULT '{}',
  caution_for skin_type[] NOT NULL DEFAULT '{}',
  is_common_allergen boolean NOT NULL DEFAULT false,
  is_sensitivity_flag boolean NOT NULL DEFAULT false,
  is_strong_active boolean NOT NULL DEFAULT false,
  is_barrier_support boolean NOT NULL DEFAULT false,
  reason text,
  source text
);

-- profiles table (user-scoped, RLS)
CREATE TABLE profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  ai_skin_type skin_type,
  user_skin_type skin_type,
  ai_acne_severity acne_severity,
  user_acne_severity acne_severity,
  skin_type_confidence numeric,
  acne_severity_confidence numeric,
  model_version text,
  age int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- allergies table (user-scoped, RLS)
CREATE TABLE allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  allergen text NOT NULL,
  UNIQUE (user_id, allergen)
);

-- sensitivities table (user-scoped, RLS)
CREATE TABLE sensitivities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  sensitivity text NOT NULL,
  UNIQUE (user_id, sensitivity)
);

-- checks table (history, user-scoped, RLS, should-have)
CREATE TABLE checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  product_id uuid NOT NULL REFERENCES products(id),
  verdict text NOT NULL,
  factors_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
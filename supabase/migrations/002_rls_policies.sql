-- Migration 002: RLS policies
-- Run order: 2nd (after 001_types_and_tables.sql)

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitivities ENABLE ROW LEVEL SECURITY;
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_concerns ENABLE ROW LEVEL SECURITY;

-- profiles: users can only access their own profile
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (user_id = auth.uid());

-- allergies: users can only access their own allergies
CREATE POLICY "allergies_own" ON allergies
  FOR ALL USING (user_id = auth.uid());

-- sensitivities: users can only access their own sensitivities
CREATE POLICY "sensitivities_own" ON sensitivities
  FOR ALL USING (user_id = auth.uid());

-- checks: users can only access their own check history
CREATE POLICY "checks_own" ON checks
  FOR ALL USING (user_id = auth.uid());

-- products: public read (catalog is shared, no user data)
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (true);

-- ingredient_concerns: public read (lookup table, no user data)
CREATE POLICY "ingredient_concerns_public_read" ON ingredient_concerns
  FOR SELECT USING (true);
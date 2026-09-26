-- Migration 005: Atomic profile save + insert WITH CHECK
-- Run order: 5th (after 004_scans_table.sql)
-- The app persists profile, allergies, and sensitivities in one call
-- via rpc('save_profile'). Without this function every save fans out to
-- three tables and can leave partial state. The function runs as the
-- invoking user (SECURITY INVOKER) so RLS still applies.

-- Inserts need WITH CHECK, not just USING. Add explicit insert policies
-- for the user-scoped tables (idempotent: drop if replaced).
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "allergies_insert_own" ON allergies;
CREATE POLICY "allergies_insert_own" ON allergies
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "sensitivities_insert_own" ON sensitivities;
CREATE POLICY "sensitivities_insert_own" ON sensitivities
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "checks_insert_own" ON checks;
CREATE POLICY "checks_insert_own" ON checks
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "scans_insert_own" ON scans;
CREATE POLICY "scans_insert_own" ON scans
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Atomic save: one transaction for profile + allergies + sensitivities.
CREATE OR REPLACE FUNCTION save_profile(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  item text;
BEGIN
  INSERT INTO profiles (
    user_id, user_skin_type, user_acne_severity, age,
    ai_skin_type, ai_acne_severity,
    skin_type_confidence, acne_severity_confidence, model_version,
    updated_at
  ) VALUES (
    auth.uid(),
    NULLIF(payload->>'user_skin_type', '')::skin_type,
    NULLIF(payload->>'user_acne_severity', '')::acne_severity,
    NULLIF(payload->>'age', '')::int,
    NULLIF(payload->>'ai_skin_type', '')::skin_type,
    NULLIF(payload->>'ai_acne_severity', '')::acne_severity,
    NULLIF(payload->>'skin_type_confidence', '')::numeric,
    NULLIF(payload->>'acne_severity_confidence', '')::numeric,
    payload->>'model_version',
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    user_skin_type = EXCLUDED.user_skin_type,
    user_acne_severity = EXCLUDED.user_acne_severity,
    age = EXCLUDED.age,
    ai_skin_type = EXCLUDED.ai_skin_type,
    ai_acne_severity = EXCLUDED.ai_acne_severity,
    skin_type_confidence = EXCLUDED.skin_type_confidence,
    acne_severity_confidence = EXCLUDED.acne_severity_confidence,
    model_version = EXCLUDED.model_version,
    updated_at = now();

  DELETE FROM allergies WHERE user_id = auth.uid();
  FOR item IN SELECT jsonb_array_elements_text(COALESCE(payload->'allergies', '[]'::jsonb))
  LOOP
    INSERT INTO allergies (user_id, allergen) VALUES (auth.uid(), item)
    ON CONFLICT (user_id, allergen) DO NOTHING;
  END LOOP;

  DELETE FROM sensitivities WHERE user_id = auth.uid();
  FOR item IN SELECT jsonb_array_elements_text(COALESCE(payload->'sensitivities', '[]'::jsonb))
  LOOP
    INSERT INTO sensitivities (user_id, sensitivity) VALUES (auth.uid(), item)
    ON CONFLICT (user_id, sensitivity) DO NOTHING;
  END LOOP;
END;
$$;

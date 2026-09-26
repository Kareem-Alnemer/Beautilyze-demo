-- Correct ownership without deleting historical records.
BEGIN;
DROP POLICY IF EXISTS scans_anon_insert ON public.scans;
DROP POLICY IF EXISTS scans_own ON public.scans;
CREATE POLICY scans_own ON public.scans FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;

-- Deleting an account must also delete its derived personal data.
ALTER TABLE public.profiles DROP CONSTRAINT profiles_user_id_fkey;
ALTER TABLE public.profiles ADD FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.allergies DROP CONSTRAINT allergies_user_id_fkey;
ALTER TABLE public.allergies ADD FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sensitivities DROP CONSTRAINT sensitivities_user_id_fkey;
ALTER TABLE public.sensitivities ADD FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.checks DROP CONSTRAINT checks_user_id_fkey;
ALTER TABLE public.checks ADD FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.scans DROP CONSTRAINT scans_user_id_fkey;
ALTER TABLE public.scans ADD FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- One RPC executes all writes in the same transaction. RLS still applies.
CREATE OR REPLACE FUNCTION public.save_profile(payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE owner_id uuid := auth.uid();
BEGIN
  IF owner_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
  INSERT INTO profiles (user_id, user_skin_type, user_acne_severity, age,
    ai_skin_type, ai_acne_severity, skin_type_confidence, acne_severity_confidence, model_version)
  VALUES (owner_id, (payload->>'user_skin_type')::skin_type,
    (payload->>'user_acne_severity')::acne_severity, (payload->>'age')::int,
    (payload->>'ai_skin_type')::skin_type, (payload->>'ai_acne_severity')::acne_severity,
    (payload->>'skin_type_confidence')::numeric, (payload->>'acne_severity_confidence')::numeric,
    payload->>'model_version')
  ON CONFLICT (user_id) DO UPDATE SET
    user_skin_type = EXCLUDED.user_skin_type, user_acne_severity = EXCLUDED.user_acne_severity,
    age = EXCLUDED.age, ai_skin_type = EXCLUDED.ai_skin_type,
    ai_acne_severity = EXCLUDED.ai_acne_severity,
    skin_type_confidence = EXCLUDED.skin_type_confidence,
    acne_severity_confidence = EXCLUDED.acne_severity_confidence,
    model_version = EXCLUDED.model_version, updated_at = now();
  DELETE FROM allergies WHERE user_id = owner_id;
  INSERT INTO allergies (user_id, allergen)
    SELECT owner_id, value FROM jsonb_array_elements_text(payload->'allergies');
  DELETE FROM sensitivities WHERE user_id = owner_id;
  INSERT INTO sensitivities (user_id, sensitivity)
    SELECT owner_id, value FROM jsonb_array_elements_text(payload->'sensitivities');
END;
$$;
REVOKE ALL ON FUNCTION public.save_profile(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_profile(jsonb) TO authenticated;
COMMIT;

-- Migration 006: remap 'sensitive' out of skin_type_tags
-- Run order: 6th (after 005_save_profile.sql)
--
-- Blueprint §7.1: 'sensitivity' is a concern tag, not a skin type, and the
-- skin_type ENUM ('dry', 'normal', 'oily') has no 'sensitive' value.
-- Fresh seeds never contain it (scripts/seed-catalog.mjs sanitizes
-- skin_type_tags at generation: 'sensitive' is dropped and 'sensitivity'
-- is ensured in concern_tags). This statement repairs databases seeded by
-- other means (dashboard inserts, older tooling). Idempotent: rows without
-- the stray tag are untouched, and 'sensitivity' is never duplicated.

UPDATE products
SET
  skin_type_tags = COALESCE(
    (SELECT array_agg(u.tag) FROM unnest(skin_type_tags) AS u(tag) WHERE u.tag::text <> 'sensitive'),
    '{}'
  ),
  concern_tags = CASE
    WHEN 'sensitivity'::concern_tag = ANY (concern_tags) THEN concern_tags
    ELSE concern_tags || 'sensitivity'::concern_tag
  END
WHERE skin_type_tags::text[] @> ARRAY['sensitive']
  AND id IN (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000010'
  );

-- Migration 003: Indexes
-- Run order: 3rd (after 002_rls_policies.sql)

-- GIN indexes for array columns (efficient containment queries)
CREATE INDEX idx_products_skin_type_tags ON products USING GIN (skin_type_tags);
CREATE INDEX idx_products_concern_tags ON products USING GIN (concern_tags);

-- B-tree indexes for foreign keys and common query patterns
CREATE INDEX idx_allergies_user ON allergies (user_id);
CREATE INDEX idx_sensitivities_user ON sensitivities (user_id);
CREATE INDEX idx_checks_user ON checks (user_id);
CREATE INDEX idx_checks_product ON checks (product_id);
CREATE INDEX idx_checks_created_at ON checks (created_at DESC);

-- Index for ingredient_concerns lookups by alias (if needed for reverse lookup)
-- Note: aliases is an array, GIN index would be needed for containment
CREATE INDEX idx_ingredient_concerns_aliases ON ingredient_concerns USING GIN (aliases);
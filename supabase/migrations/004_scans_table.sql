-- Migration 004: Scans table for storing analysis results
-- Run order: 4th (after 003_indexes.sql)

-- Custom ENUM types for scans (reuse existing enums)
-- skin_type and acne_severity already created in 001_types_and_tables.sql

-- scans table (user-scoped, RLS)
CREATE TABLE scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  skin_type skin_type NOT NULL,
  skin_confidence numeric NOT NULL,
  acne_severity acne_severity NOT NULL,
  acne_confidence numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Policy: users can only access their own scans
CREATE POLICY "scans_own" ON scans
  FOR ALL USING (user_id = auth.uid());

-- Policy: allow anonymous inserts (for unauthenticated scans)
CREATE POLICY "scans_anon_insert" ON scans
  FOR INSERT WITH CHECK (true);

-- Index for user_id lookups
CREATE INDEX idx_scans_user_id ON scans(user_id);

-- Index for created_at for time-based queries
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);
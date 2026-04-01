-- 011_create_families.sql
-- Family grouping: links multiple users to a single family entity

CREATE TABLE IF NOT EXISTS families (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name        VARCHAR(255) NOT NULL,
  primary_contact_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add family_id to users (nullable — not every user belongs to a family unit)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE SET NULL;

CREATE INDEX idx_users_family ON users (family_id);

-- 014_create_settings.sql
-- Key-value store for app-wide configuration (donation provider, etc.)

CREATE TABLE IF NOT EXISTS settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Default donation settings
INSERT INTO settings (key, value) VALUES
  ('donation_provider',       'disabled'),
  ('zeffy_form_url',          ''),
  ('stripe_publishable_key',  ''),
  ('stripe_secret_key',       ''),
  ('donation_title',          'Give to Avenue Progressive Baptist Church'),
  ('donation_description',    'Your generosity supports our ministries and community outreach.')
ON CONFLICT (key) DO NOTHING;

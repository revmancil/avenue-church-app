-- 003_create_sermon_series.sql
CREATE TABLE IF NOT EXISTS sermon_series (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  cover_url   TEXT,
  start_date  DATE,
  end_date    DATE,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER sermon_series_updated_at
  BEFORE UPDATE ON sermon_series
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

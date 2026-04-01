-- 005_create_events.sql
CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  location     VARCHAR(255),
  event_date   TIMESTAMPTZ  NOT NULL,
  end_date     TIMESTAMPTZ,
  max_capacity INTEGER,
  is_public    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events (event_date DESC);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

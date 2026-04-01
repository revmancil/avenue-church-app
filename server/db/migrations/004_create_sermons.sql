-- 004_create_sermons.sql
CREATE TABLE IF NOT EXISTS sermons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id   UUID REFERENCES sermon_series(id) ON DELETE SET NULL,
  title       VARCHAR(255) NOT NULL,
  scripture   VARCHAR(255),
  notes       TEXT,
  audio_url   TEXT,
  video_url   TEXT,
  sermon_date DATE         NOT NULL,
  preacher    VARCHAR(255) NOT NULL DEFAULT 'Dr. Mancil Carroll III',
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sermons_series ON sermons (series_id);
CREATE INDEX idx_sermons_date   ON sermons (sermon_date DESC);

CREATE TRIGGER sermons_updated_at
  BEFORE UPDATE ON sermons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 007_create_donations.sql
CREATE TABLE IF NOT EXISTS donations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  amount       NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  fund         VARCHAR(100)  NOT NULL DEFAULT 'General',
  method       VARCHAR(50)   NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'check', 'card', 'online', 'other')),
  notes        TEXT,
  donated_at   DATE          NOT NULL DEFAULT CURRENT_DATE,
  recorded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_user      ON donations (user_id);
CREATE INDEX idx_donations_date      ON donations (donated_at DESC);
CREATE INDEX idx_donations_fund      ON donations (fund);

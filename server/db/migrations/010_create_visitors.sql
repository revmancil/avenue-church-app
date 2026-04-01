-- 010_create_visitors.sql
CREATE TABLE IF NOT EXISTS visitors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(20),
  address         TEXT,
  visit_date      DATE         NOT NULL DEFAULT CURRENT_DATE,
  how_heard       VARCHAR(255),
  notes           TEXT,
  followup_sent   BOOLEAN      NOT NULL DEFAULT FALSE,
  followup_sent_at TIMESTAMPTZ,
  added_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visitors_email      ON visitors (email);
CREATE INDEX idx_visitors_visit_date ON visitors (visit_date DESC);
CREATE INDEX idx_visitors_followup   ON visitors (followup_sent);

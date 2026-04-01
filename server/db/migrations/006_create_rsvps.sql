-- 006_create_rsvps.sql
CREATE TABLE IF NOT EXISTS rsvps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     VARCHAR(20) NOT NULL DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT rsvps_event_user_unique UNIQUE (event_id, user_id)
);

CREATE INDEX idx_rsvps_event ON rsvps (event_id);
CREATE INDEX idx_rsvps_user  ON rsvps (user_id);

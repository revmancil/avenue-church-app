-- 009_create_member_ministries.sql
CREATE TABLE IF NOT EXISTS member_ministries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ministry_id  UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT member_ministry_unique UNIQUE (user_id, ministry_id)
);

CREATE INDEX idx_member_ministries_user     ON member_ministries (user_id);
CREATE INDEX idx_member_ministries_ministry ON member_ministries (ministry_id);

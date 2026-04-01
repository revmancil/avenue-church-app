-- 013_add_ministry_to_events.sql
-- Link events to a ministry so we can count events per ministry

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES ministries(id) ON DELETE SET NULL;

CREATE INDEX idx_events_ministry ON events (ministry_id);

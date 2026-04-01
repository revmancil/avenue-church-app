-- 012_add_visitor_status.sql
-- Visitor funnel state machine: New → Contacted → Follow-up → Converted → Inactive

CREATE TYPE visitor_status AS ENUM ('new', 'contacted', 'follow_up', 'converted', 'inactive');

ALTER TABLE visitors
  ADD COLUMN IF NOT EXISTS status visitor_status NOT NULL DEFAULT 'new';

CREATE INDEX idx_visitors_status ON visitors (status);

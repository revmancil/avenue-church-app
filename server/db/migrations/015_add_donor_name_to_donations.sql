-- 015_add_donor_name_to_donations.sql
-- Allows recording donations for non-member / guest donors by name
ALTER TABLE donations ADD COLUMN IF NOT EXISTS donor_name VARCHAR(200);

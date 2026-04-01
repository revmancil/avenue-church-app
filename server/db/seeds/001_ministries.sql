-- Seed: Default ministries for Avenue Progressive Baptist Church
INSERT INTO ministries (name, description, meets_at) VALUES
  ('Outreach Ministry',    'Community outreach and evangelism efforts',           'Saturdays at 9am'),
  ('Worship Team',         'Leading the congregation in praise and worship',      'Thursdays at 7pm'),
  ('Youth Ministry',       'Spiritual development for teens and young adults',    'Sundays at 9am'),
  ('Deacon Board',         'Servant leadership and congregational care',          'First Monday at 7pm'),
  ('Men''s Fellowship',    'Brotherhood, accountability, and spiritual growth',   'Second Saturday at 8am'),
  ('Women''s Ministry',    'Empowering and equipping women of faith',            'Third Saturday at 10am'),
  ('Children''s Church',   'Nurturing children ages 3–12 in faith',              'Sundays at 11am'),
  ('Hospitality Ministry', 'Welcoming guests and facilitating fellowship',        'As scheduled'),
  ('Prayer Warriors',      'Intercessory prayer for the church and community',   'Wednesdays at 6pm'),
  ('Media Ministry',       'Audio, visual, and online broadcast support',         'Sundays at 9am')
ON CONFLICT (name) DO NOTHING;

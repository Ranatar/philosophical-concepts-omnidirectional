-- Seed data for users table
-- Contains test users for development environment

BEGIN;

-- Create test users with different roles
-- Note: In a real environment, passwords would be hashed, but for testing we're using plaintext with the word 'hashed_' prepended
-- Admin user
INSERT INTO users (
  user_id, 
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  status, 
  role, 
  settings, 
  created_at, 
  last_login
)
VALUES (
  'd47ac10b-58cc-4372-a567-0e02b2c3d001', 
  'admin', 
  'admin@example.com', 
  'hashed_Admin123!', 
  'Admin', 
  'User', 
  'active', 
  'admin', 
  '{"theme": "dark", "language": "en", "notifications": {"email": true, "push": false}}', 
  NOW() - INTERVAL '30 days', 
  NOW() - INTERVAL '1 day'
);

-- Moderator user
INSERT INTO users (
  user_id, 
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  status, 
  role, 
  settings, 
  created_at, 
  last_login
)
VALUES (
  'd47ac10b-58cc-4372-a567-0e02b2c3d002', 
  'moderator', 
  'moderator@example.com', 
  'hashed_Moderator123!', 
  'Moderator', 
  'User', 
  'active', 
  'moderator', 
  '{"theme": "light", "language": "en", "notifications": {"email": true, "push": true}}', 
  NOW() - INTERVAL '25 days', 
  NOW() - INTERVAL '3 days'
);

-- Regular users
INSERT INTO users (
  user_id, 
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  status, 
  role, 
  settings, 
  created_at, 
  last_login
)
VALUES 
  (
    'd47ac10b-58cc-4372-a567-0e02b2c3d003', 
    'johndoe', 
    'john@example.com', 
    'hashed_JohnDoe123!', 
    'John', 
    'Doe', 
    'active', 
    'user', 
    '{"theme": "light", "language": "en", "notifications": {"email": true, "push": true}}', 
    NOW() - INTERVAL '20 days', 
    NOW() - INTERVAL '2 days'
  ),
  (
    'd47ac10b-58cc-4372-a567-0e02b2c3d004', 
    'janedoe', 
    'jane@example.com', 
    'hashed_JaneDoe123!', 
    'Jane', 
    'Doe', 
    'active', 
    'user', 
    '{"theme": "dark", "language": "en", "notifications": {"email": false, "push": true}}', 
    NOW() - INTERVAL '15 days', 
    NOW() - INTERVAL '5 days'
  ),
  (
    'd47ac10b-58cc-4372-a567-0e02b2c3d005', 
    'bobsmith', 
    'bob@example.com', 
    'hashed_BobSmith123!', 
    'Bob', 
    'Smith', 
    'active', 
    'user', 
    '{"theme": "light", "language": "es", "notifications": {"email": true, "push": false}}', 
    NOW() - INTERVAL '10 days', 
    NOW() - INTERVAL '1 day'
  );

-- Guest user
INSERT INTO users (
  user_id, 
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  status, 
  role, 
  settings, 
  created_at, 
  last_login
)
VALUES (
  'd47ac10b-58cc-4372-a567-0e02b2c3d006', 
  'guest', 
  'guest@example.com', 
  'hashed_Guest123!', 
  'Guest', 
  'User', 
  'active', 
  'guest', 
  '{"theme": "light", "language": "en", "notifications": {"email": false, "push": false}}', 
  NOW() - INTERVAL '5 days', 
  NOW() - INTERVAL '1 day'
);

-- Inactive user
INSERT INTO users (
  user_id, 
  username, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  status, 
  role, 
  settings, 
  created_at, 
  last_login
)
VALUES (
  'd47ac10b-58cc-4372-a567-0e02b2c3d007', 
  'inactive', 
  'inactive@example.com', 
  'hashed_Inactive123!', 
  'Inactive', 
  'User', 
  'inactive', 
  'user', 
  '{"theme": "light", "language": "en", "notifications": {"email": true, "push": true}}', 
  NOW() - INTERVAL '60 days', 
  NOW() - INTERVAL '45 days'
);

-- Create user activity for testing
INSERT INTO user_activity (
  activity_id,
  user_id,
  activity_type,
  target_id,
  activity_date,
  details
)
VALUES
  (
    'a47ac10b-58cc-4372-a567-0e02b2c3d001',
    'd47ac10b-58cc-4372-a567-0e02b2c3d003',
    'login',
    NULL,
    NOW() - INTERVAL '5 days',
    '{}'
  ),
  (
    'a47ac10b-58cc-4372-a567-0e02b2c3d002',
    'd47ac10b-58cc-4372-a567-0e02b2c3d003',
    'view_concept',
    'c47ac10b-58cc-4372-a567-0e02b2c3d001',
    NOW() - INTERVAL '4 days',
    '{"duration": 300}'
  ),
  (
    'a47ac10b-58cc-4372-a567-0e02b2c3d003',
    'd47ac10b-58cc-4372-a567-0e02b2c3d003',
    'create_concept',
    'c47ac10b-58cc-4372-a567-0e02b2c3d002',
    NOW() - INTERVAL '3 days',
    '{}'
  ),
  (
    'a47ac10b-58cc-4372-a567-0e02b2c3d004',
    'd47ac10b-58cc-4372-a567-0e02b2c3d004',
    'login',
    NULL,
    NOW() - INTERVAL '2 days',
    '{}'
  ),
  (
    'a47ac10b-58cc-4372-a567-0e02b2c3d005',
    'd47ac10b-58cc-4372-a567-0e02b2c3d004',
    'create_graph',
    'g47ac10b-58cc-4372-a567-0e02b2c3d001',
    NOW() - INTERVAL '1 day',
    '{}'
  ),
  (
    'a47ac10b-58cc-4372-a567-0e02b2c3d006',
    'd47ac10b-58cc-4372-a567-0e02b2c3d005',
    'login',
    NULL,
    NOW() - INTERVAL '1 day',
    '{}'
  ),
  (
    'a47ac10b-58cc-4372-a567-0e02b2c3d007',
    'd47ac10b-58cc-4372-a567-0e02b2c3d005',
    'claude_interaction',
    'i47ac10b-58cc-4372-a567-0e02b2c3d001',
    NOW() - INTERVAL '12 hours',
    '{"query_type": "graph_validation"}'
  );

COMMIT;

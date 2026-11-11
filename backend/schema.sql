-- ═══════════════════════════════════════════════════════════
--  IssueLens (Campus Portal) — PostgreSQL Schema + Seed Data (Neon)
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Students Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id         SERIAL PRIMARY KEY,
  en_number  VARCHAR(20)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  year       SMALLINT     NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- ─── 2. Admins Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,   -- bcrypt hash
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- ─── 3. Complaints Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id                SERIAL PRIMARY KEY,
  student_id        INT          NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_en_number VARCHAR(20)  NOT NULL,
  student_name      VARCHAR(100) NOT NULL,
  category          VARCHAR(50)  NOT NULL,
  description       TEXT         NOT NULL,
  image_path        VARCHAR(500) DEFAULT NULL,
  status            VARCHAR(20)  NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In_Progress', 'Resolved')),
  created_at        TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- ─── 4. Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);

-- ─── 5. Trigger for updated_at ────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_complaints_timestamp ON complaints;
CREATE TRIGGER set_complaints_timestamp
BEFORE UPDATE ON complaints
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ═══════════════════════════════════════════════════════════
--  SEED DATA
-- ═══════════════════════════════════════════════════════════

-- ─── Seed Students ───────────────────────────────────────────
INSERT INTO students (en_number, name, department, year) VALUES
  -- Demo Student Accounts (for public testing / GitHub)
  ('EN24991001', 'Aarav Sharma',     'Computer Science',       2),
  ('EN24991002', 'Ananya Verma',    'Information Technology', 3),
  ('EN24991003', 'Siddharth Rao',   'Mechanical',             1),
  ('EN24991004', 'Diya Joshi',      'Civil',                  4),

  -- Pre-enrolled Campus Students
  ('EN24156683', 'Rohan Hede',        'Computer Science',      3),
  ('EN24156684', 'Rohit Hande',       'Electrical',            2),
  ('EN24156685', 'Karan Sule',        'Civil',                 1),
  ('EN24156686', 'Shivraj Khanapure', 'Mechanical',            4),
  ('EN24156687', 'Sujit Nil',         'Electronics',           2),
  ('EN24156688', 'Akshay Vhanmane',   'Information Technology',3),
  ('EN24156689', 'Samarth Borale',    'Computer Science',      1),
  ('EN24156690', 'Vishal Gholve',     'Electrical',            2),
  ('EN24156691', 'Jagdish Shinde',    'Civil',                 3),
  ('EN24156692', 'Piyush Sathe',      'Mechanical',            1),
  ('EN24156693', 'Omkar Billa',       'Computer Science',      2),
  ('EN24156694', 'Shantesh Bhakare',  'Electronics',           4),
  ('EN24156695', 'Priya Kulkarni',    'Information Technology',3),
  ('EN24156696', 'Sneha More',        'Computer Science',      1),
  ('EN24156697', 'Pooja Patil',       'Electrical',            2),
  ('EN24156698', 'Anita Jadhav',      'Civil',                 3),
  ('EN24156699', 'Rahul Deshmukh',    'Mechanical',            2),
  ('EN24156700', 'Neha Gaikwad',      'Computer Science',      1)
ON CONFLICT (en_number) DO NOTHING;

-- ─── Seed Admins (Demo admin provided for testing) ───────────
-- Note: Official admin accounts are loaded securely from .env via seed.js
-- Demo credentials: username="demo_admin", password="DemoAdmin@2026"
INSERT INTO admins (username, password, name) VALUES
  ('demo_admin', '$2a$10$pcRZw8ulkLZs7ejlXHI2SOqZjHvb8p.k2V2SAFe0Fot693SvK1Qoi', 'Demo Administrator')
ON CONFLICT (username) DO NOTHING;

-- ─── Seed Complaints ─────────────────────────────────────────
INSERT INTO complaints (student_id, student_en_number, student_name, category, description, status, created_at, updated_at) VALUES
  (1, 'EN24156683', 'Rohan Hede',        'WiFi',        'WiFi not working in Block-A lab since Monday. Students unable to access online resources.',       'Pending',     NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  (2, 'EN24156684', 'Rohit Hande',       'Electricity', 'Power fluctuation in Room 204 causing equipment to reset. Computers lose unsaved work.',          'In_Progress', NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 days'),
  (3, 'EN24156685', 'Karan Sule',        'Water',       'No water supply in girls hostel C-wing since yesterday evening.',                                  'Pending',     NOW() - INTERVAL '8 days',  NOW() - INTERVAL '8 days'),
  (4, 'EN24156686', 'Shivraj Khanapure', 'Classroom',   'Projector in CS-301 classroom not functioning. Professor using whiteboard for all lectures.',      'Resolved',    NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days'),
  (5, 'EN24156687', 'Sujit Nil',         'Cleanliness', 'Garbage not collected near canteen for 3 days. Smell is affecting the eating experience.',          'Pending',     NOW() - INTERVAL '7 days',  NOW() - INTERVAL '7 days'),
  (6, 'EN24156688', 'Akshay Vhanmane',   'Hostel',      'Broken window in hostel room H-105. Security concern and cold air entering at night.',              'In_Progress', NOW() - INTERVAL '11 days', NOW() - INTERVAL '4 days'),
  (7, 'EN24156689', 'Samarth Borale',    'WiFi',        'Internet speed extremely slow in library. Downloads timing out.',                                   'Pending',     NOW() - INTERVAL '6 days',  NOW() - INTERVAL '6 days'),
  (8, 'EN24156690', 'Vishal Gholve',     'Electricity', 'Street lights on main road outside hostel not working after 8 PM. Safety concern.',                'Resolved',    NOW() - INTERVAL '18 days', NOW() - INTERVAL '2 days'),
  (9, 'EN24156691', 'Jagdish Shinde',    'Water',       'Water leakage in ground floor washroom near gym. Floor always wet, creating slip hazard.',          'Pending',     NOW() - INTERVAL '5 days',  NOW() - INTERVAL '5 days'),
  (2, 'EN24156684', 'Rohit Hande',       'Other',       'Notice board in front of admin office is broken. Important notices keep falling down.',             'Pending',     NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days');

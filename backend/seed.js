// ═══════════════════════════════════════════════════════════════
//  seed.js — Run to set up PostgreSQL (Neon) tables + seed data
//  Usage:  node seed.js  or  npm run seed
// ═══════════════════════════════════════════════════════════════
const path = require('path');
const dotenv = require('dotenv');

// Ensure .env is loaded whether running from project root or backend folder
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

let connectionString = process.env.DATABASE_URL;
if (connectionString) {
  connectionString = connectionString
    .replace(/([?&])channel_binding=[^&]+(&|$)/, '$1')
    .replace(/[?&]$/, '');
}

const STUDENTS = [
  // ── 4 Dedicated Demo Students (For public testing / GitHub) ───
  { en: 'EN24991001', name: 'Aarav Sharma',     dept: 'Computer Science',       year: 2 },
  { en: 'EN24991002', name: 'Ananya Verma',    dept: 'Information Technology', year: 3 },
  { en: 'EN24991003', name: 'Siddharth Rao',   dept: 'Mechanical',             year: 1 },
  { en: 'EN24991004', name: 'Diya Joshi',      dept: 'Civil',                  year: 4 },

  // ── Pre-enrolled Campus Students ──────────────────────────────
  { en: 'EN24156683', name: 'Rohan Hede',        dept: 'Computer Science',      year: 3 },
  { en: 'EN24156684', name: 'Rohit Hande',       dept: 'Electrical',            year: 2 },
  { en: 'EN24156685', name: 'Karan Sule',        dept: 'Civil',                 year: 1 },
  { en: 'EN24156686', name: 'Shivraj Khanapure', dept: 'Mechanical',            year: 4 },
  { en: 'EN24156687', name: 'Sujit Nil',         dept: 'Electronics',           year: 2 },
  { en: 'EN24156688', name: 'Akshay Vhanmane',   dept: 'Information Technology',year: 3 },
  { en: 'EN24156689', name: 'Samarth Borale',    dept: 'Computer Science',      year: 1 },
  { en: 'EN24156690', name: 'Vishal Gholve',     dept: 'Electrical',            year: 2 },
  { en: 'EN24156691', name: 'Jagdish Shinde',    dept: 'Civil',                 year: 3 },
  { en: 'EN24156692', name: 'Piyush Sathe',      dept: 'Mechanical',            year: 1 },
  { en: 'EN24156693', name: 'Omkar Billa',       dept: 'Computer Science',      year: 2 },
  { en: 'EN24156694', name: 'Shantesh Bhakare',  dept: 'Electronics',           year: 4 },
  { en: 'EN24156695', name: 'Priya Kulkarni',    dept: 'Information Technology',year: 3 },
  { en: 'EN24156696', name: 'Sneha More',        dept: 'Computer Science',      year: 1 },
  { en: 'EN24156697', name: 'Pooja Patil',       dept: 'Electrical',            year: 2 },
  { en: 'EN24156698', name: 'Anita Jadhav',      dept: 'Civil',                 year: 3 },
  { en: 'EN24156699', name: 'Rahul Deshmukh',    dept: 'Mechanical',            year: 2 },
  { en: 'EN24156700', name: 'Neha Gaikwad',      dept: 'Computer Science',      year: 1 },
];

async function run() {
  const clientConfig = connectionString
    ? {
        connectionString,
        ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      }
    : {
        host:     process.env.PGHOST || process.env.DB_HOST || 'localhost',
        port:     Number(process.env.PGPORT || process.env.DB_PORT) || 5432,
        user:     process.env.PGUSER || process.env.DB_USER || 'postgres',
        password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.PGDATABASE || process.env.DB_NAME || 'campus_portal',
        ssl:      process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      };

  const client = new Client(clientConfig);

  try {
    console.log('\n🔌  Connecting to PostgreSQL (Neon)...');
    await client.connect();
    console.log('   Connected.\n');

    // ── 1. Create tables ──────────────────────────────────────────
    console.log('🗂️   Creating PostgreSQL tables...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id         SERIAL PRIMARY KEY,
        en_number  VARCHAR(20)  NOT NULL UNIQUE,
        name       VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        year       SMALLINT     NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id         SERIAL PRIMARY KEY,
        username   VARCHAR(50)  NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        name       VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
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
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON complaints(student_id);
      CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
      CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
      CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
    `);

    // Auto-update trigger for updated_at
    await client.query(`
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
    `);

    console.log('   ✓  Tables, indexes, and triggers ready.\n');

    // ── 2. Seed students ──────────────────────────────────────────
    console.log('👩‍🎓  Seeding students (including demo accounts)...');
    for (const s of STUDENTS) {
      await client.query(
        `INSERT INTO students (en_number, name, department, year)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (en_number) DO NOTHING`,
        [s.en, s.name, s.dept, s.year]
      );
    }
    console.log(`   ✓  ${STUDENTS.length} students inserted (duplicates skipped)\n`);

    // ── 3. Seed admins with dynamic bcrypt hashing ────────────────
    console.log('🔐  Seeding admins...');

    const adminsToSeed = [];

    // 1. Official Admin (Loaded securely from .env, NEVER committed to GitHub)
    const officialUsername = process.env.ADMIN_USERNAME || 'Rohan';
    const officialPassword = process.env.ADMIN_PASSWORD;
    const officialName     = process.env.ADMIN_NAME || 'Rohan (Admin)';

    if (officialPassword) {
      adminsToSeed.push({
        username: officialUsername,
        password: officialPassword,
        name:     officialName,
        isDemo:   false,
      });
    } else {
      console.log('   ℹ️   ADMIN_PASSWORD not provided in .env — skipping official admin creation.');
    }

    // 2. Demo Admin (Safe for public GitHub cloning and demo testing)
    adminsToSeed.push({
      username: 'demo_admin',
      password: 'DemoAdmin@2026',
      name:     'Demo Administrator',
      isDemo:   true,
    });

    for (const a of adminsToSeed) {
      const hash = await bcrypt.hash(a.password, 10);
      await client.query(
        `INSERT INTO admins (username, password, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO UPDATE
         SET password = EXCLUDED.password, name = EXCLUDED.name`,
        [a.username, hash, a.name]
      );
      console.log(`   ✓  Admin "${a.username}" (${a.name}) seeded with dynamic bcrypt hash`);
    }
    console.log('');

    // ── 4. Seed sample complaints (only if table empty) ───────────
    const countRes = await client.query('SELECT COUNT(*)::int AS cnt FROM complaints');
    const cnt = countRes.rows[0].cnt;

    if (cnt === 0) {
      console.log('📋  Seeding sample complaints...');
      const studentRes = await client.query('SELECT id, en_number, name FROM students ORDER BY id LIMIT 10');
      const studentRows = studentRes.rows;
      const pick = i => studentRows[i % studentRows.length];

      const samples = [
        { cat: 'WiFi',        desc: 'WiFi not working in Block-A lab since Monday. Students unable to access online resources.', status: 'Pending' },
        { cat: 'Electricity', desc: 'Power fluctuation in Room 204 causing equipment to reset. Computers lose unsaved work.', status: 'In_Progress' },
        { cat: 'Water',       desc: 'No water supply in girls hostel C-wing since yesterday evening.', status: 'Pending' },
        { cat: 'Classroom',   desc: 'Projector in CS-301 classroom not functioning. Professor using whiteboard for all lectures.', status: 'Resolved' },
        { cat: 'Cleanliness', desc: 'Garbage not collected near canteen for 3 days. Smell is affecting the eating experience.', status: 'Pending' },
        { cat: 'Hostel',      desc: 'Broken window in hostel room H-105. Security concern and cold air entering at night.', status: 'In_Progress' },
        { cat: 'WiFi',        desc: 'Internet speed extremely slow in library. Downloads timing out.', status: 'Pending' },
        { cat: 'Electricity', desc: 'Street lights on main road outside hostel not working after 8 PM. Safety concern.', status: 'Resolved' },
        { cat: 'Water',       desc: 'Water leakage in ground floor washroom near gym. Floor always wet, creating slip hazard.', status: 'Pending' },
        { cat: 'Other',       desc: 'Notice board in front of admin office is broken. Important notices keep falling down.', status: 'Pending' },
      ];

      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const st = pick(i);
        await client.query(
          `INSERT INTO complaints (student_id, student_en_number, student_name, category, description, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [st.id, st.en_number, st.name, s.cat, s.desc, s.status]
        );
      }
      console.log(`   ✓  ${samples.length} sample complaints inserted\n`);
    } else {
      console.log(`   ℹ️   Complaints table already has ${cnt} rows — skipping sample seed\n`);
    }

    console.log('✅  All done! Database is ready for PostgreSQL (Neon).');

  } catch (err) {
    console.error('\n❌  Seed failed:', err.message);
    if (!connectionString) {
      console.error('    → DATABASE_URL is missing. Please set DATABASE_URL in backend/.env');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();

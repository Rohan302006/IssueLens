// ─── routes/auth.js ──────────────────────────────────────────
const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const router  = express.Router();

// ── Student Login ─────────────────────────────────────────────
// POST /api/auth/student/login
// Body: { enNumber }
// Looks up student by EN number (case-insensitive, no password required).
router.post('/student/login', async (req, res) => {
  try {
    const { enNumber } = req.body;

    if (!enNumber || !enNumber.trim()) {
      return res.status(400).json({ error: 'Please enter your Enrollment Number.' });
    }

    const formattedEn = enNumber.trim().toUpperCase();

    const { rows } = await db.query(
      'SELECT id, en_number, name, department, year FROM students WHERE UPPER(en_number) = $1',
      [formattedEn]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: `EN Number "${formattedEn}" not found. Please check and try again.` });
    }

    const student = rows[0];

    // Save to session
    req.session.user = {
      role:       'STUDENT',
      id:         student.id,
      enNumber:   student.en_number,
      name:       student.name,
      department: student.department,
      year:       student.year,
    };

    return res.json({
      message:    'Login successful',
      role:       'STUDENT',
      enNumber:   student.en_number,
      name:       student.name,
      department: student.department,
    });

  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── Student Registration ──────────────────────────────────────
// POST /api/auth/student/register
// Body: { enNumber, name, department, year }
router.post('/student/register', async (req, res) => {
  try {
    const { enNumber, name, department, year } = req.body;

    if (!enNumber || !enNumber.trim()) {
      return res.status(400).json({ error: 'Enrollment Number is required.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full Name is required.' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ error: 'Please select your department.' });
    }
    const parsedYear = parseInt(year, 10);
    if (!parsedYear || parsedYear < 1 || parsedYear > 5) {
      return res.status(400).json({ error: 'Please select a valid year of study.' });
    }

    const formattedEn = enNumber.trim().toUpperCase();

    // Check if student with this EN number already exists
    const existing = await db.query(
      'SELECT id FROM students WHERE UPPER(en_number) = $1',
      [formattedEn]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: `Enrollment Number "${formattedEn}" is already registered. Please sign in instead.`,
      });
    }

    // Insert new student into PostgreSQL
    const { rows } = await db.query(
      `INSERT INTO students (en_number, name, department, year)
       VALUES ($1, $2, $3, $4)
       RETURNING id, en_number, name, department, year`,
      [formattedEn, name.trim(), department.trim(), parsedYear]
    );

    const student = rows[0];

    // Auto-login: save to session
    req.session.user = {
      role:       'STUDENT',
      id:         student.id,
      enNumber:   student.en_number,
      name:       student.name,
      department: student.department,
      year:       student.year,
    };

    return res.status(201).json({
      message:    'Registration successful',
      role:       'STUDENT',
      enNumber:   student.en_number,
      name:       student.name,
      department: student.department,
      year:       student.year,
    });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: `Enrollment Number "${req.body.enNumber?.toUpperCase()}" is already registered. Please sign in instead.`,
      });
    }
    console.error('Student registration error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── Admin Login ────────────────────────────────────────────────
// POST /api/auth/admin/login
// Body: { username, password }
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim() || !password) {
      return res.status(400).json({ error: 'Please enter both username and password.' });
    }

    const { rows } = await db.query(
      'SELECT id, username, password, name FROM admins WHERE username = $1',
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Save to session
    req.session.user = {
      role:     'ADMIN',
      id:       admin.id,
      username: admin.username,
      name:     admin.name,
    };

    return res.json({
      message:  'Login successful',
      role:     'ADMIN',
      username: admin.username,
      name:     admin.name,
    });

  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── Logout ────────────────────────────────────────────────────
// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully.' });
  });
});

// ── Session Check ─────────────────────────────────────────────
// GET /api/auth/me — used by frontend to check if still logged in
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  return res.json(req.session.user);
});

module.exports = router;

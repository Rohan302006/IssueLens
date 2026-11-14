// ─── routes/students.js ───────────────────────────────────────
const express = require('express');
const path    = require('path');
const multer  = require('multer');
let xlsx      = null;
try {
  xlsx = require('xlsx');
} catch (e) {
  console.warn('XLSX module not loaded:', e.message);
}
const db      = require('../db');
const router  = express.Router();

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Admin login required.' });
  }
  next();
}

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed.'));
    }
  },
});

function handleExcelUpload(req, res, next) {
  excelUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Excel file exceeds maximum size of 10MB.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

// GET /api/students
// Returns all students (admin only).
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, en_number, name, department, year FROM students ORDER BY en_number'
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET /students error:', err);
    return res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

// GET /api/students/find/:query
// Search student by EN Number or Name (admin only, for confirmation before deletion)
router.get('/find/:query', requireAdmin, async (req, res) => {
  try {
    const q = req.params.query.trim();
    if (!q) {
      return res.status(400).json({ error: 'Search query required.' });
    }

    const { rows } = await db.query(
      `SELECT id, en_number, name, department, year
       FROM students
       WHERE UPPER(en_number) = $1 OR LOWER(name) = $2 OR name ILIKE $3
       LIMIT 5`,
      [q.toUpperCase(), q.toLowerCase(), `%${q}%`]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: `No student found matching "${q}". Please check the EN Number or Name.` });
    }

    return res.json(rows);
  } catch (err) {
    console.error('GET /students/find error:', err);
    return res.status(500).json({ error: 'Failed to search student.' });
  }
});

// POST /api/students
// Add a new student (admin only).
// Body: { enNumber, name, department, year }
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { enNumber, name, department, year } = req.body;

    if (!enNumber || !name || !department || !year) {
      return res.status(400).json({ error: 'All fields (enNumber, name, department, year) are required.' });
    }

    await db.query(
      'INSERT INTO students (en_number, name, department, year) VALUES ($1, $2, $3, $4)',
      [enNumber.trim().toUpperCase(), name.trim(), department.trim(), parseInt(year, 10)]
    );

    return res.status(201).json({ message: 'Student added successfully.' });

  } catch (err) {
    if (err.code === '23505') { // Postgres unique_violation
      return res.status(409).json({ error: `EN Number "${req.body.enNumber}" already exists.` });
    }
    console.error('POST /students error:', err);
    return res.status(500).json({ error: 'Failed to add student.' });
  }
});

// POST /api/students/bulk
// Bulk-insert students from an array (admin only).
// Body: { students: [{ enNumber, name, department, year }, ...] }
router.post('/bulk', requireAdmin, async (req, res) => {
  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: 'Provide a non-empty students array.' });
  }

  const values = students.map(s => [
    (s.enNumber || s.en_number || '').trim().toUpperCase(),
    (s.name       || '').trim(),
    (s.department || '').trim(),
    parseInt(s.year, 10) || 1,
  ]);

  // Reject if any row has empty required fields
  const invalid = values.filter(r => !r[0] || !r[1] || !r[2]);
  if (invalid.length > 0) {
    return res.status(400).json({
      error: `${invalid.length} rows are missing required fields (enNumber, name, department).`,
    });
  }

  try {
    const valuePlaceholders = [];
    const flat = [];
    let idx = 1;

    for (const row of values) {
      valuePlaceholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3})`);
      flat.push(row[0], row[1], row[2], row[3]);
      idx += 4;
    }

    const sql = `
      INSERT INTO students (en_number, name, department, year)
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (en_number) DO NOTHING
    `;

    const result = await db.query(sql, flat);

    return res.json({
      message:  'Bulk insert complete.',
      inserted: result.rowCount,
      skipped:  values.length - result.rowCount,
      total:    values.length,
    });

  } catch (err) {
    console.error('POST /students/bulk error:', err);
    return res.status(500).json({ error: 'Bulk insert failed.' });
  }
});

// POST /api/students/upload-excel
// Upload and parse an Excel spreadsheet (.xlsx, .xls) or CSV (admin only)
router.post('/upload-excel', requireAdmin, handleExcelUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please choose an Excel file (.xlsx or .xls) to upload.' });
    }

    if (!xlsx) {
      return res.status(500).json({ error: 'Excel parsing engine is unavailable.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return res.status(400).json({ error: 'The uploaded Excel file contains no worksheets.' });
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ error: 'The uploaded Excel sheet contains no rows.' });
    }

    // Identify header row
    let startIndex = 0;
    let headerMap = { en: -1, name: -1, dept: -1, year: -1 };

    const firstRow = rawRows[0].map(c => String(c || '').toLowerCase().trim());
    firstRow.forEach((col, idx) => {
      if (col.includes('en') || col.includes('enroll') || col.includes('roll')) headerMap.en = idx;
      else if (col.includes('name') || col.includes('student')) headerMap.name = idx;
      else if (col.includes('dept') || col.includes('branch') || col.includes('department')) headerMap.dept = idx;
      else if (col.includes('year') || col.includes('grade')) headerMap.year = idx;
    });

    if (headerMap.en !== -1 && headerMap.name !== -1) {
      startIndex = 1;
    } else {
      headerMap = { en: 0, name: 1, dept: 2, year: 3 };
      startIndex = 0;
    }

    const parsedStudents = [];
    for (let i = startIndex; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || !Array.isArray(row) || row.length === 0) continue;

      const enVal   = row[headerMap.en];
      const nameVal = row[headerMap.name];
      const deptVal = headerMap.dept !== -1 ? row[headerMap.dept] : 'General';
      const yearVal = headerMap.year !== -1 ? row[headerMap.year] : 1;

      if (!enVal || !nameVal) continue;

      parsedStudents.push({
        enNumber:   String(enVal).trim().toUpperCase(),
        name:       String(nameVal).trim(),
        department: String(deptVal || 'General').trim(),
        year:       parseInt(yearVal, 10) || 1,
      });
    }

    if (parsedStudents.length === 0) {
      return res.status(400).json({
        error: 'No valid student entries found in Excel sheet. Ensure columns contain EN Number and Student Name.',
      });
    }

    // Insert batch into PostgreSQL
    const values = parsedStudents.map(s => [
      s.enNumber,
      s.name,
      s.department,
      s.year,
    ]);

    const valuePlaceholders = [];
    const flat = [];
    let idx = 1;

    for (const r of values) {
      valuePlaceholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3})`);
      flat.push(r[0], r[1], r[2], r[3]);
      idx += 4;
    }

    const sql = `
      INSERT INTO students (en_number, name, department, year)
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (en_number) DO NOTHING
    `;

    const result = await db.query(sql, flat);

    return res.json({
      message:  `Excel import complete. Successfully added ${result.rowCount} students.`,
      inserted: result.rowCount,
      skipped:  values.length - result.rowCount,
      total:    values.length,
    });

  } catch (err) {
    console.error('POST /students/upload-excel error:', err);
    return res.status(500).json({ error: 'Failed to process Excel file: ' + err.message });
  }
});

// DELETE /api/students/:identifier
// Delete a student by ID, EN Number, or Name (admin only)
router.delete('/:identifier', requireAdmin, async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Student EN Number or ID is required.' });
    }

    const clean = identifier.trim();

    let result;
    if (/^\d+$/.test(clean)) {
      result = await db.query(
        'DELETE FROM students WHERE id = $1 RETURNING id, en_number, name, department, year',
        [parseInt(clean, 10)]
      );
    } else {
      result = await db.query(
        'DELETE FROM students WHERE UPPER(en_number) = $1 RETURNING id, en_number, name, department, year',
        [clean.toUpperCase()]
      );
    }

    if (result.rowCount === 0) {
      result = await db.query(
        'DELETE FROM students WHERE LOWER(name) = $1 RETURNING id, en_number, name, department, year',
        [clean.toLowerCase()]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: `Student "${clean}" not found.` });
    }

    const deleted = result.rows[0];
    return res.json({
      message: `Student ${deleted.name} (${deleted.en_number}) has been permanently deleted.`,
      student: deleted,
    });

  } catch (err) {
    console.error('DELETE /students error:', err);
    return res.status(500).json({ error: 'Failed to delete student: ' + err.message });
  }
});

module.exports = router;

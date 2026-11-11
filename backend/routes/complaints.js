// ─── routes/complaints.js ─────────────────────────────────────
const express    = require('express');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
let cloudinary = null;
try {
  cloudinary = require('cloudinary').v2;
} catch (e) {
  // Cloudinary module not loaded locally; disk fallback will be used
}
const db = require('../db');
const router = express.Router();

// ── Cloudinary Configuration ──────────────────────────────────
if (
  cloudinary &&
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ── Multer in-memory storage for Cloudinary / disk fallback ───
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed.'));
    }
  },
});

function uploadMiddleware(req, res, next) {
  upload.single('image')(req, res, err => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image file size exceeds the 5MB limit.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

// Helper function: upload to Cloudinary if configured, else save locally
async function processImageUpload(fileBuffer, originalname) {
  if (
    cloudinary &&
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'issuelens_complaints',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  // Local fallback: save to uploads folder
  const dir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(originalname).toLowerCase();
  const filename = `complaint_${Date.now()}${ext}`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, fileBuffer);
  return `/uploads/${filename}`;
}

// ── Auth middleware ────────────────────────────────────────────
function requireStudent(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'STUDENT')
    return res.status(401).json({ error: 'Student login required.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'ADMIN')
    return res.status(401).json({ error: 'Admin login required.' });
  next();
}

// ══════════════════════════════════════════════════════════════
//  IMPORTANT: Fixed-path routes (/my, /stats, /my/stats)
//  MUST be declared BEFORE the wildcard route (/:id).
// ══════════════════════════════════════════════════════════════

// ── GET /api/complaints/my ────────────────────────────────────
// Student: get their own complaints
router.get('/my', requireStudent, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, category, description, image_path, status, created_at, updated_at
       FROM complaints
       WHERE student_id = $1
       ORDER BY created_at DESC`,
      [req.session.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET /my error:', err);
    return res.status(500).json({ error: 'Failed to fetch complaints.' });
  }
});

// ── GET /api/complaints/my/stats ──────────────────────────────
// Student: get their own stats
router.get('/my/stats', requireStudent, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*)::int                                      AS total,
         COUNT(*) FILTER (WHERE status = 'Pending')::int     AS pending,
         COUNT(*) FILTER (WHERE status = 'In_Progress')::int AS "inProgress",
         COUNT(*) FILTER (WHERE status = 'Resolved')::int    AS resolved
       FROM complaints
       WHERE student_id = $1`,
      [req.session.user.id]
    );
    return res.json(rows[0]);
  } catch (err) {
    console.error('GET /my/stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ── GET /api/complaints/stats ─────────────────────────────────
// Admin: overall stats across all complaints
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*)::int                                      AS total,
         COUNT(*) FILTER (WHERE status = 'Pending')::int     AS pending,
         COUNT(*) FILTER (WHERE status = 'In_Progress')::int AS "inProgress",
         COUNT(*) FILTER (WHERE status = 'Resolved')::int    AS resolved
       FROM complaints`
    );
    return res.json(rows[0]);
  } catch (err) {
    console.error('GET /stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ── GET /api/complaints ───────────────────────────────────────
// Admin: paginated + filtered list of ALL complaints
router.get('/', requireAdmin, async (req, res) => {
  try {
    const search   = (req.query.search   || '').trim();
    const status   = (req.query.status   || '').trim();
    const category = (req.query.category || '').trim();
    const size     = Math.min(50, Math.max(1, parseInt(req.query.size, 10) || 10));
    const page     = Math.max(0, parseInt(req.query.page, 10) || 0);

    const conditions = [];
    const params     = [];
    let paramIdx     = 1;

    if (search) {
      conditions.push(
        `(student_en_number ILIKE $${paramIdx} OR student_name ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR category ILIKE $${paramIdx})`
      );
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (status) {
      conditions.push(`status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }
    if (category) {
      conditions.push(`category = $${paramIdx}`);
      params.push(category);
      paramIdx++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    // Total count for pagination
    const countRes = await db.query(
      `SELECT COUNT(*)::int AS total FROM complaints ${where}`,
      params
    );
    const total      = countRes.rows[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / size));
    const safePage   = Math.min(page, totalPages - 1);
    const offset     = safePage * size;

    // Fetch page of data using parameterized LIMIT and OFFSET
    const queryParams = [...params, size, offset];
    const { rows } = await db.query(
      `SELECT id, student_id, student_en_number, student_name,
              category, description, image_path, status, created_at, updated_at
       FROM complaints ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      queryParams
    );

    return res.json({
      items:      rows,
      total,
      page:       safePage,
      size,
      totalPages,
      isLast:     safePage >= totalPages - 1,
    });

  } catch (err) {
    console.error('GET /complaints error:', err);
    return res.status(500).json({ error: 'Failed to fetch complaints.' });
  }
});

// ── POST /api/complaints ──────────────────────────────────────
// Student: submit a new complaint (multipart/form-data)
router.post('/', requireStudent, uploadMiddleware, async (req, res) => {
  try {
    const { category, description } = req.body;
    const { id, enNumber, name }    = req.session.user;

    if (!category || !category.trim())
      return res.status(400).json({ error: 'Please select a category.' });
    if (!description || description.trim().length < 10)
      return res.status(400).json({ error: 'Description must be at least 10 characters.' });

    let imagePath = null;
    if (req.file) {
      imagePath = await processImageUpload(req.file.buffer, req.file.originalname);
    }

    const { rows } = await db.query(
      `INSERT INTO complaints
         (student_id, student_en_number, student_name, category, description, image_path, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
       RETURNING id`,
      [id, enNumber, name, category.trim(), description.trim(), imagePath]
    );

    return res.status(201).json({ message: 'Complaint submitted successfully.', id: rows[0].id });

  } catch (err) {
    console.error('POST /complaints error:', err);
    return res.status(500).json({ error: 'Failed to submit complaint.' });
  }
});

// ── PATCH /api/complaints/:id/status ─────────────────────────
// Admin: update status of a specific complaint
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({ error: 'Invalid complaint ID.' });
    }

    const { status } = req.body;
    if (!['Pending', 'In_Progress', 'Resolved'].includes(status))
      return res.status(400).json({ error: 'Invalid status value.' });

    const result = await db.query(
      `UPDATE complaints SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, complaintId]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Complaint not found.' });

    return res.json({ message: 'Status updated successfully.' });

  } catch (err) {
    console.error('PATCH status error:', err);
    return res.status(500).json({ error: 'Failed to update status.' });
  }
});

// ── DELETE /api/complaints/:id ────────────────────────────────
// Admin: delete a complaint and its image (Cloudinary or local)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({ error: 'Invalid complaint ID.' });
    }

    const { rows } = await db.query(
      'SELECT image_path FROM complaints WHERE id = $1',
      [complaintId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // 1. Delete complaint from PostgreSQL immediately
    await db.query('DELETE FROM complaints WHERE id = $1', [complaintId]);

    // 2. Respond immediately to admin frontend so the UI never hangs or freezes
    res.json({ message: 'Complaint deleted successfully.' });

    // 3. Clean up the image asynchronously in the background (fire-and-forget)
    const img = rows[0].image_path;
    if (img) {
      (async () => {
        try {
          if (
            cloudinary &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET &&
            img.includes('cloudinary.com')
          ) {
            const parts = img.split('/');
            const filenameWithExt = parts.pop();
            const folder = parts.pop();
            const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;
            await cloudinary.uploader.destroy(publicId);
          } else if (img.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', img);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        } catch (cleanupErr) {
          console.warn('[cleanup] Background image cleanup notice:', cleanupErr.message);
        }
      })();
    }

  } catch (err) {
    console.error('DELETE complaint error:', err);
    return res.status(500).json({ error: 'Failed to delete complaint.' });
  }
});

module.exports = router;

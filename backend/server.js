// ═══════════════════════════════════════════════════════════════
//  server.js — IssueLens Backend (Node.js + Express + PostgreSQL)
// ═══════════════════════════════════════════════════════════════
const path = require('path');
const dotenv = require('dotenv');
// Ensure .env is loaded whether running from project root or backend folder
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const express        = require('express');
const session        = require('express-session');
const cors           = require('cors');
const fs             = require('fs');

const authRoutes      = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const studentRoutes   = require('./routes/students');

const app  = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ─── Trust Reverse Proxy (Required for Render & Vercel HTTPS) ─
app.set('trust proxy', 1);

// ─── CORS Configuration ───────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (mobile, curl, server-to-server) or same-origin
    if (!origin) return callback(null, true);
    // Allow configured origins, local development, or any Vercel deployment preview
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Session Configuration ────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || 'campus_portal_neon_secret_2026',
  resave:            false,
  saveUninitialized: false,
  proxy:             true,
  cookie: {
    httpOnly: true,
    secure:   isProd,                  // Required when sameSite is 'none' in production
    sameSite: isProd ? 'none' : 'lax', // 'none' allows cross-origin cookies between Vercel & Render
    maxAge:   8 * 60 * 60 * 1000,      // 8 hours
  },
}));

// ─── Health Check for Render ──────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'IssueLens Backend',
    timestamp: new Date().toISOString(),
  });
});

// ─── Static Files ─────────────────────────────────────────────
const frontendPath = path.join(__dirname, '..', 'frontend');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
}

// Serve uploaded images (local fallback storage)
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/students',   studentRoutes);

// Fallback for unhandled /api requests — return clean JSON 404
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// ─── Catch-all: serve index.html for non-API routes ───────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.json({ message: 'IssueLens Backend API is running.' });
    }
  }
});

// ─── Global Error Handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎓  IssueLens Backend running on port ${PORT}`);
  console.log(`🗄️   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗  Health check: http://localhost:${PORT}/api/health\n`);
});

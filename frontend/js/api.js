// ═══════════════════════════════════════════════════════════════
//  api.js — Frontend API client
//  Handles communication with the Node.js / PostgreSQL backend.
// ═══════════════════════════════════════════════════════════════

// ─── Resolve API Base URL ─────────────────────────────────────
// Defaults to /api. If running frontend on Live Server (port 5500, etc.),
// automatically connects to the backend server on port 5000.
function resolveApiBase() {
  if (window.API_BASE) return window.API_BASE;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal && window.location.port && window.location.port !== '5000') {
    return `http://${window.location.hostname}:5000/api`;
  }
  return '/api';
}

const API_BASE = resolveApiBase();

// ─── Core fetch wrapper ───────────────────────────────────────
// Sends JSON requests, handles credentials, timeouts, and errors uniformly.
async function apiFetch(url, options = {}) {
  const defaultOpts = {
    credentials: 'include',          // send/receive cookies (session)
    headers: { 'Content-Type': 'application/json' },
  };

  // Don't set Content-Type for FormData (let browser set it with boundary)
  if (options.body instanceof FormData) {
    delete defaultOpts.headers['Content-Type'];
  }

  // 30-second timeout controller (allows Neon cold-start wakeups without infinite hang)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

  let res;
  try {
    res = await fetch(API_BASE + url, {
      ...defaultOpts,
      ...options,
      signal: controller.signal,
    });
  } catch (netErr) {
    if (netErr.name === 'AbortError') {
      throw new Error('Request timed out. The server or database may be starting up; please try again in a few seconds.');
    }
    throw new Error('Cannot connect to server. Ensure your backend server is running on port 5000.');
  } finally {
    clearTimeout(timeoutId);
  }

  let data = {};
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try { data = await res.json(); } catch { data = {}; }
  } else {
    try {
      const text = await res.text();
      if (text && text.length < 200 && !text.includes('<!DOCTYPE')) {
        data = { error: text };
      }
    } catch { /* ignore */ }
  }

  if (!res.ok) {
    if (res.status === 404 && !data.error) {
      throw new Error('API route not found (404). Please restart your backend server with "npm start" so the latest routes are loaded.');
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════
//  Auth API
// ═══════════════════════════════════════════════════════════════
const Auth = {
  // Returns current session from server (used on page load to check login state)
  async me() {
    try { return await apiFetch('/auth/me'); }
    catch { return null; }
  },

  async loginStudent(enNumber) {
    return apiFetch('/auth/student/login', {
      method: 'POST',
      body:   JSON.stringify({ enNumber }),
    });
  },

  async registerStudent({ enNumber, name, department, year }) {
    return apiFetch('/auth/student/register', {
      method: 'POST',
      body:   JSON.stringify({ enNumber, name, department, year }),
    });
  },

  async loginAdmin(username, password) {
    return apiFetch('/auth/admin/login', {
      method: 'POST',
      body:   JSON.stringify({ username, password }),
    });
  },

  async logout() {
    return apiFetch('/auth/logout', { method: 'POST' });
  },
};

// ═══════════════════════════════════════════════════════════════
//  Complaint API
// ═══════════════════════════════════════════════════════════════
const ComplaintAPI = {
  // Student: get own complaints
  async getMy() {
    return apiFetch('/complaints/my');
  },

  // Student: get own stats
  async getMyStats() {
    return apiFetch('/complaints/my/stats');
  },

  // Student: submit new complaint (with optional image file)
  async submit({ category, description, imageFile }) {
    const form = new FormData();
    form.append('category',    category);
    form.append('description', description);
    if (imageFile) form.append('image', imageFile);

    return apiFetch('/complaints', {
      method: 'POST',
      body:   form,
    });
  },

  // Admin: get all complaints with optional filters
  async getAll({ search = '', status = '', category = '', page = 0, size = 10 } = {}) {
    const params = new URLSearchParams();
    if (search)   params.set('search',   search);
    if (status)   params.set('status',   status);
    if (category) params.set('category', category);
    params.set('page', page);
    params.set('size', size);
    return apiFetch(`/complaints?${params.toString()}`);
  },

  // Admin: get overall stats
  async getStats() {
    return apiFetch('/complaints/stats');
  },

  // Admin: update complaint status
  async updateStatus(id, status) {
    return apiFetch(`/complaints/${id}/status`, {
      method: 'PATCH',
      body:   JSON.stringify({ status }),
    });
  },

  // Admin: delete a complaint
  async delete(id) {
    return apiFetch(`/complaints/${id}`, { method: 'DELETE' });
  },
};

// ═══════════════════════════════════════════════════════════════
//  Student API (Admin endpoints for managing campus students)
// ═══════════════════════════════════════════════════════════════
const StudentAPI = {
  // Admin: get all registered students
  async getAll() {
    return apiFetch('/students');
  },

  // Admin: add a single student
  async addStudent({ enNumber, name, department, year }) {
    return apiFetch('/students', {
      method: 'POST',
      body:   JSON.stringify({ enNumber, name, department, year }),
    });
  },

  // Admin: bulk insert students
  async bulkAdd(students) {
    return apiFetch('/students/bulk', {
      method: 'POST',
      body:   JSON.stringify({ students }),
    });
  },
};

// ═══════════════════════════════════════════════════════════════
//  UI Helpers (shared across all pages)
// ═══════════════════════════════════════════════════════════════

function statusBadge(status) {
  const cfg = {
    'Pending':     ['badge-pending',  '⏳ Pending'],
    'In_Progress': ['badge-progress', '🔄 In Progress'],
    'Resolved':    ['badge-resolved', '✅ Resolved'],
  };
  const [cls, label] = cfg[status] || ['badge-pending', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function categoryIcon(cat) {
  const icons = {
    Electricity: '⚡',
    Water:       '💧',
    Cleanliness: '🧹',
    WiFi:        '📶',
    Classroom:   '🏫',
    Hostel:      '🏠',
    Other:       '📌',
  };
  return icons[cat] || '📌';
}

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', {
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// Resolves full URL for images whether Cloudinary (https://) or local (/uploads/)
function getImageUrl(img) {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img;
  }
  const base = window.API_BASE || '';
  if (base.startsWith('http')) {
    try {
      const origin = new URL(base).origin;
      return origin + (img.startsWith('/') ? img : '/' + img);
    } catch { /* fallback */ }
  }
  return img;
}

function showToast(message, type = 'info') {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// Initialise navbar: show user badge and wire up logout button
function initNavbar(logoutHref) {
  const badge  = document.getElementById('user-badge');
  const logBtn = document.getElementById('logout-btn');

  const userStr = sessionStorage.getItem('cp_user');
  const user    = userStr ? JSON.parse(userStr) : null;

  if (badge && user) {
    badge.textContent = user.enNumber || user.username || 'User';
  }

  if (logBtn) {
    logBtn.addEventListener('click', async () => {
      try { await Auth.logout(); } catch (e) { /* ignore */ }
      sessionStorage.removeItem('cp_user');
      window.location.href = logoutHref;
    });
  }
}

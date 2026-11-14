# 🎓 IssueLens — Campus Grievance & Facility Maintenance Portal

[![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-E34F26.svg)](#)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933.svg)](#)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-4169E1.svg)](#)
[![Storage](https://img.shields.io/badge/Media-Cloudinary-3448C5.svg)](#)
[![Deployment](https://img.shields.io/badge/Deployment-Render%20%7C%20Vercel-000000.svg)](#)

> A modern, transparent, and frictionless campus grievance and facility maintenance reporting platform engineered for educational institutions, colleges, and university campuses.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Folder & File Structure](#-folder--file-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [API Documentation](#-api-documentation)
- [Database Schema & Models](#-database-schema--models)
- [Demo Accounts & Credentials](#-demo-accounts--credentials)
- [Screenshots & UI Showcase](#-screenshots--ui-showcase)
- [Production Deployment](#-production-deployment)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 📖 Overview

In traditional campus setups, students report infrastructure breakdowns (broken electrical sockets, WiFi outages, washroom leaks, lab equipment failures) via fragmented channels: paper logbooks, informal WhatsApp messages, or verbal requests to lab assistants. These inquiries frequently get lost, duplicate reports flood staff, and students receive zero feedback on resolution status.

**IssueLens** centralizes campus grievance management into a high-performance, single-pane web portal. Students submit categorized issues with photo evidence in seconds, track real-time resolution progress, and administrators prioritize work orders, update statuses, and inspect high-resolution evidence from a unified control center.

### 🌟 Core Highlights

* **Zero-Password Student Authentication:** Students sign in instantly with their unique college **Enrollment Number (EN)** without the friction of passwords.
* **Institutional Access Control:** Open self-registration is restricted to prevent unauthorized issue filing; student directories are maintained centrally by campus administration with individual and bulk Excel/CSV/JSON ingestion.
* **Photographic Evidence Uploads:** Supports direct image uploads (drag-and-drop or file selection) up to 5MB with client-side preview, stored permanently via **Cloudinary CDN** (with local disk fallback).
* **Transparent Status Lifecycle:** Workflows transition cleanly across `Pending` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved`.
* **Centralized Admin Control Room:** Campus administrators filter complaints by category, status, or keyword, inspect high-resolution photos in interactive modals, update statuses inline, and perform instant safe deletions.
* **100% Student-Friendly Free-Tier Stack:** Architected to run at zero cost on **Vercel** (Frontend), **Render** (Backend), **Neon** (Serverless PostgreSQL), and **Cloudinary** (Media CDN).

---

## 🚀 Key Features

### 👩‍🎓 Student Portal
* **EN-Based Login:** Case-insensitive Enrollment Number authentication.
* **Pre-Enrolled Institutional Verification:** Dedicated EN-based login checks verified college enrollment rosters to ensure only legitimate campus students can submit issues.
* **Personalized Dashboard:** Live metric summary cards (Total, Pending, In Progress, Resolved) and personal complaint history.
* **Complaint Submission Form:**
  * Categorization: `⚡ Electricity`, `💧 Water`, `🧹 Cleanliness`, `📶 WiFi`, `🏫 Classroom`, `🏠 Hostel`, and `📌 Other`.
  * Dynamic character counter (minimum 10 characters).
  * Drag-and-drop or click-to-upload image attachment with instant thumbnail preview and remove capability.
* **Interactive Detail Modal:** Students can view their complete submission details, full complaint description, and zoomable photographic evidence.
* **Live Search & Filter:** Filter submitted complaints by category, status, or keyword.

### 🛡️ Admin Management Suite
* **Secure Admin Login:** Salting and password hashing powered by `bcryptjs`.
* **Campus-Wide Metrics:** Live aggregates displaying pending grievances, work in progress, and resolution rates.
* **Multi-Parameter Search:** Real-time search across EN number, student name, category, and issue description.
* **Responsive Inline Status Dropdown:** Update status on the fly with immediate badge reflection and metric updates.
* **Photo Evidence Viewer:** View uploaded photos in an interactive inspection modal.
* **Instant Safe Deletion:** Asynchronous complaint deletion with UI feedback (`"Deleting..."`), background media cleanup, and confirmation modals.
* **Student Directory & Deletion Management:** Review enrolled students, search records, add students individually, import in bulk via Excel spreadsheets (.xlsx, .xls) or CSV/JSON, and permanently delete students with two-step modal confirmation and cascade complaint removal.

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Markup** | HTML5 | Living Standard | Semantic, accessible web structure |
| **Frontend Styling** | CSS3 (Custom Design System) | Modern CSS | CSS Variables, responsive grid/flexbox, typography (*DM Serif Display* + *DM Sans*) |
| **Frontend Scripting** | Vanilla JavaScript | ES6+ | Fetch API client, state management, modal lifecycle, zero heavy frameworks |
| **Backend Runtime** | Node.js | $\ge$ 18.0.0 | High-performance asynchronous JavaScript engine |
| **Web Framework** | Express.js | 4.19.2 | RESTful routing, middleware, multipart form handling |
| **Database** | PostgreSQL (**Neon Serverless**) | 16+ | Cloud PostgreSQL with SSL, connection pooling, and autosuspend |
| **Media Storage** | Cloudinary | 2.1.0 | Cloud image storage, CDN delivery, and automatic transformations |
| **Authentication** | `express-session` + `bcryptjs` | 1.18.0 / 2.4.3 | Secure cookie sessions and salted password hashing |
| **Spreadsheet Engine** | SheetJS (`xlsx`) | 0.18.5 | Server-side parsing of Excel (.xlsx, .xls) and CSV student rosters |
| **File Handling** | `multer` | 1.4.5-lts.1 | In-memory stream buffer for image uploads |
| **Hosting Target** | **Render** & **Vercel** | — | Render Web Service (Node.js API) & Vercel (Frontend Static CDN) |

---

## 📐 Project Architecture

```
                          ┌─────────────────────────┐
                          │    Student / Admin      │
                          │   Web Browser (Client)  │
                          └────────────┬────────────┘
                                       │
                         HTTPS / JSON / Multipart
                                       │
                                       ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                       Node.js + Express Backend                     │
    │                                                                     │
    │  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐  │
    │  │   Auth Router   │   │ Complaint Router │   │  Student Router  │  │
    │  │  (/api/auth)    │   │ (/api/complaints)│   │  (/api/students) │  │
    │  └────────┬────────┘   └────────┬─────────┘   └────────┬─────────┘  │
    │           │                     │                      │            │
    │           ▼                     ▼                      ▼            │
    │  ┌───────────────────────────────────────────────────────────────┐  │
    │  │              Resilient Database Pool Layer (db.js)            │  │
    │  │         (30s Timeout, Neon Auto-Retry, Socket Keep-Alive)     │  │
    │  └──────────────────────────────┬────────────────────────────────┘  │
    └─────────────────────────────────┼───────────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
                 ▼                                         ▼
   ┌───────────────────────────┐             ┌───────────────────────────┐
   │ Neon Serverless Postgres  │             │   Cloudinary Media CDN    │
   │   (Relational Database)   │             │   (Complaint Photos)      │
   │  students | admins | ...  │             │  issuelens_complaints/    │
   └───────────────────────────┘             └───────────────────────────┘
```

### Architectural Highlights

1. **Decoupled Architecture:** The frontend is entirely static, communicating strictly via clean RESTful JSON endpoints (`/api/*`). It can be hosted independently on Vercel while the backend runs on Render.
2. **Reverse Proxy Trust:** Configured with `app.set('trust proxy', 1)` to correctly forward client IPs, HTTPS protocols, and Secure session cookies across Render and Vercel.
3. **Neon Serverless Optimization:** Built-in resilience in `db.js` specifically designed for Neon serverless compute sleep states:
   - `connectionTimeoutMillis: 30000` (30 seconds) comfortably accommodates 5–9 second cold starts.
   - Transparent query auto-retries on transient socket resets (`ECONNRESET`, `57P01`).
   - Sockets stripped of incompatible `channel_binding=require` for full PgBouncer pooler support.
4. **Non-blocking Background Cleanup:** When deleting grievances, the database record is removed immediately and returns HTTP 200, while Cloudinary photo destruction occurs asynchronously in the background.

---

## 📁 Folder & File Structure

```
IssueLens/
├── backend/
│   ├── routes/
│   │   ├── auth.js            # Student EN login, admin auth, session management
│   │   ├── complaints.js      # Grievance CRUD, stats aggregation, Cloudinary upload & delete
│   │   └── students.js        # Admin student directory, Excel/CSV/JSON bulk import, and student deletion
│   ├── uploads/               # Local disk storage folder for media (dev fallback)
│   ├── .env                   # Backend environment configuration (git-ignored)
│   ├── .env.example           # Environment template with documentation
│   ├── db.js                  # PostgreSQL (Neon) connection pool manager with retry handling
│   ├── package.json           # Backend dependency manifest and scripts
│   ├── schema.sql             # PostgreSQL schema, foreign keys, triggers, and seed data
│   ├── seed.js                # Database initialization and bcrypt account seeding utility
│   └── server.js              # Express application entry point, CORS, sessions, static routing
│
├── frontend/
│   ├── css/
│   │   └── styles.css         # Custom design system tokens, typography, responsive media queries
│   ├── js/
│   │   └── api.js             # Centralized API fetch wrapper, environment resolver, UI helpers
│   ├── pages/
│   │   ├── landing.html       # Public institutional landing page with dual portal gateways
│   │   ├── index.html         # Student portal login page (EN authentication)
│   │   ├── register.html      # Institutional access policy notice (self-registration disabled)
│   │   ├── student-dashboard.html # Student complaints overview, metrics, and evidence viewer
│   │   ├── submit-complaint.html  # Grievance submission form with drag-and-drop photo upload
│   │   ├── admin-login.html   # Campus administrator login portal
│   │   └── admin-dashboard.html   # Admin master management dashboard and resolution controls
│   ├── index.html             # Static root entry point (auto-redirects to pages/landing.html)
│   └── vercel.json            # Vercel deployment routing and clean URL configuration
│
├── screenshots/               # High-resolution application preview screenshots
│   ├── 01-student-login.png
│   ├── 02-student-register.png
│   ├── 03-student-dashboard.png
│   ├── 04-submit-complaint.png
│   ├── 05-admin-login.png
│   ├── 06-admin-dashboard.png
│   ├── 07-complaint-detail-modal.png
│   └── 08-admin-students-tab.png
│
├── .env                       # Root environment file (mirrored for root npm commands)
├── .env.example               # Root template for environment variables
├── .gitignore                 # Git ignore file protecting node_modules, .env, and uploads
├── antigravity.md             # Master developer context, architectural history, and roadmap
├── package.json               # Root workspace runner scripts
└── README.md                  # Comprehensive technical project documentation
```

---

## 📋 Prerequisites

Ensure you have the following installed before running the project locally:

* **Node.js:** `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
* **npm:** `v9.0.0` or higher (bundled with Node.js)
* **Neon PostgreSQL Database:** A free serverless database instance on [Neon](https://neon.tech)
* **Cloudinary Account (Optional for Dev, Required for Production):** A free media account on [Cloudinary](https://cloudinary.com)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Rohan302006/IssueLens.git
cd IssueLens
```

### 2. Install Dependencies

You can install dependencies from the repository root or inside `backend/`:

```bash
# Option A: From root directory
npm install --prefix backend

# Option B: Inside backend directory
cd backend
npm install
```

### 3. Configure Environment Variables

Create your local `.env` file by copying the provided `.env.example`:

```bash
# On Linux / macOS:
cp backend/.env.example backend/.env

# On Windows (PowerShell):
Copy-Item backend\.env.example backend\.env
```

Open `backend/.env` in your code editor and populate your database and admin credentials:

```env
PORT=5000
NODE_ENV=development
SESSION_SECRET=a_very_long_secure_random_string_2026

# Neon PostgreSQL connection string (from Neon console)
DATABASE_URL=postgresql://your_user:your_password@ep-your-endpoint-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Secure Personal Admin Account (seeded with bcrypt; never committed to Git)
ADMIN_USERNAME=your_admin_name
ADMIN_PASSWORD=YourStrongPassword@2026
ADMIN_NAME=Your Full Name (Admin)

# Cloudinary Credentials (Optional for local testing; uses disk storage if omitted)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Allowed Frontend URL for CORS (in production, set to your Vercel URL)
CLIENT_URL=http://localhost:5000
```

> 💡 **Tip:** Also copy `.env` to the project root (`cp backend/.env .env`) so root `npm start` commands work seamlessly.

### 4. Initialize Database Schema & Seed Data

Run the automated seed script to provision tables, triggers, indexes, and initial test accounts in Neon:

```bash
npm run seed --prefix backend
# Or from inside backend/:
# npm run seed
```

---

## 🔐 Environment Variables

| Variable | Required | Default | Description | Example |
| :--- | :---: | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port on which the Express server listens | `5000` |
| `NODE_ENV` | No | `development` | Runtime environment (`development` / `production`) | `production` |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection URI with SSL mode | `postgresql://neondb_owner:***@ep-xyz.neon.tech/neondb?sslmode=require` |
| `SESSION_SECRET`| **Yes** | — | Secret string used to sign session cookies | `super_secure_random_key_9988` |
| `ADMIN_USERNAME`| No | `admin` | Username for your official administrator account | `Rohan` |
| `ADMIN_PASSWORD`| No | — | Plaintext password (hashed with bcrypt during seed) | `MySecurePass@2026` |
| `ADMIN_NAME` | No | `Administrator`| Display name for your official admin account | `Rohan Hede (Admin)` |
| `CLOUDINARY_CLOUD_NAME` | Prod | — | Cloudinary cloud identifier for media storage | `campus-portal-cloud` |
| `CLOUDINARY_API_KEY` | Prod | — | Cloudinary API access key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Prod | — | Cloudinary API secret key | `abcdefghijklmnopqrstuvwxyz0` |
| `CLIENT_URL` | No | `http://localhost:5000` | Frontend origin permitted for CORS requests | `https://issuelens.vercel.app` |

---

## 🏃 Running the Project

### Development Mode (with Live Reload)

```bash
# From repository root:
npm run dev

# Or inside backend:
cd backend
npm run dev
```

### Standard Production Server

```bash
# From repository root:
npm start

# Or inside backend:
cd backend
npm start
```

### Accessing the Web Application

* **Unified Server (Local):** Open **`http://localhost:5000`** in your browser. Express serves both the REST API and the frontend static assets.
* **VS Code Live Server (Port 5500):** If opening `frontend/index.html` via Live Server on port 5500, `frontend/js/api.js` automatically directs all API calls to `http://localhost:5000/api`.

---

## 📡 API Documentation

### 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/student/login` | Public | `{"enNumber": "EN24991001"}` | Student authentication by Enrollment Number |
| `POST` | `/api/auth/student/register`| Restricted | — | Disabled by institutional policy (returns 403 Forbidden) |
| `POST` | `/api/auth/admin/login` | Public | `{"username": "demo_admin", "password": "..."}` | Admin login (verifies bcrypt password hash) |
| `GET` | `/api/auth/me` | Logged In | — | Returns current active session user |
| `POST` | `/api/auth/logout` | Logged In | — | Clears session cookie and logs out |

### 2. Grievance Management Endpoints (`/api/complaints`)

| Method | Endpoint | Access | Query / Body Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/complaints/my` | Student | — | Fetch all complaints filed by the logged-in student |
| `GET` | `/api/complaints/my/stats` | Student | — | Return personal metrics (`total`, `pending`, `inProgress`, `resolved`) |
| `POST` | `/api/complaints` | Student | `multipart/form-data`: `category`, `description`, `image` (optional) | Submit a new grievance report with photo evidence |
| `GET` | `/api/complaints` | Admin | `?search=&status=&category=&page=0&size=10` | Paginated, filtered list of all campus grievances |
| `GET` | `/api/complaints/stats` | Admin | — | Campus-wide grievance analytics aggregate |
| `PATCH`| `/api/complaints/:id/status`| Admin | `{"status": "Pending" | "In_Progress" | "Resolved"}` | Update status of a specific complaint |
| `DELETE`| `/api/complaints/:id` | Admin | — | Permanently delete complaint and trigger background photo cleanup |

### 3. Student Administration Endpoints (`/api/students`)

| Method | Endpoint | Access | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | Admin | — | Retrieve full directory of enrolled students |
| `GET` | `/api/students/find/:query` | Admin | — | Lookup student by EN Number or full name before deletion |
| `POST` | `/api/students` | Admin | `{"enNumber": "...", "name": "...", "department": "...", "year": 1}` | Manually insert a single student record |
| `POST` | `/api/students/bulk` | Admin | `{"students": [{"enNumber": "...", "name": "..."}, ...]}` | Bulk insert student array via JSON or CSV text |
| `POST` | `/api/students/upload-excel`| Admin | `multipart/form-data`: `file` (.xlsx, .xls, .csv) | Bulk upload spreadsheet file with column auto-mapping |
| `DELETE`| `/api/students/:identifier` | Admin | — | Permanently delete student by EN, ID, or name & cascade grievances |

### 4. Health Check Endpoint

| Method | Endpoint | Access | Response | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | `{"status": "ok", "service": "IssueLens Backend", "timestamp": "..."}` | Uptime health check for Render / load balancers |

---

## 🗄️ Database Schema & Models

Provisioned in PostgreSQL (`backend/schema.sql`):

```sql
-- Students Directory
CREATE TABLE students (
  id         SERIAL PRIMARY KEY,
  en_number  VARCHAR(20)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  year       SMALLINT     NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- Administrators
CREATE TABLE admins (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- Campus Grievances
CREATE TABLE complaints (
  id                SERIAL PRIMARY KEY,
  student_id        INT          NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_en_number VARCHAR(20)  NOT NULL,
  student_name      VARCHAR(100) NOT NULL,
  category          VARCHAR(50)  NOT NULL,
  description       TEXT         NOT NULL,
  image_path        VARCHAR(500) DEFAULT NULL,
  status            VARCHAR(20)  NOT NULL DEFAULT 'Pending' 
                    CHECK (status IN ('Pending', 'In_Progress', 'Resolved')),
  created_at        TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);
```

### Database Performance Enhancements
* **Indexes:** Configured on `complaints(student_id)`, `complaints(status)`, `complaints(category)`, and `complaints(created_at)`.
* **Automated Timestamps:** PostgreSQL trigger `trigger_set_timestamp()` automatically updates `updated_at` on every status alteration.
* **Cascade Deletions:** Deleting a student cascades and cleanly purges all related complaints.

---

## 🔑 Demo Accounts & Credentials

For public testing, evaluation, and GitHub demonstration, pre-configured test accounts are included:

### 🛡️ Demo Administrator Account
| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| **`demo_admin`** | **`DemoAdmin@2026`** | Administrator | Pre-seeded demo admin account for public testing |

> 🔒 **Security Notice:** Official administrative credentials are never committed to version control. They are loaded securely from your private `.env` via `ADMIN_USERNAME` and `ADMIN_PASSWORD` and hashed using `bcrypt` during `npm run seed`.

### 👩‍🎓 Dedicated Demo Student Accounts (Passwordless EN Access)
| Enrollment Number (EN) | Student Name | Department | Year |
| :--- | :--- | :--- | :--- |
| **`EN24991001`** | Aarav Sharma | Computer Science | 2nd Year |
| **`EN24991002`** | Ananya Verma | Information Technology | 3rd Year |
| **`EN24991003`** | Siddharth Rao | Mechanical Engineering | 1st Year |
| **`EN24991004`** | Diya Joshi | Civil Engineering | 4th Year |

*(You can also click **Register as Student** on the login page to create any custom student account instantly).*

---

## 🖼️ Screenshots & UI Showcase

### 1. Student Authentication & Registration
> Clean, responsive authentication screens featuring one-click EN login and instant new-student registration with duplicate validation.

| Student Login Portal | New Student Self-Registration |
| :---: | :---: |
| ![Student Login Portal](screenshots/01-student-login.png) | ![New Student Registration](screenshots/02-student-register.png) |

---

### 2. Student Grievance Dashboard & Submission
> Real-time metric cards, interactive status filters, comprehensive issue history, and a clean drag-and-drop evidence uploader with client preview.

| Student Dashboard & Status Metrics | File a Grievance (with Drag & Drop Upload) |
| :---: | :---: |
| ![Student Dashboard](screenshots/03-student-dashboard.png) | ![Submit Grievance](screenshots/04-submit-complaint.png) |

---

### 3. Administrator Control Center & Student Directory
> High-level resolution analytics, keyword search, inline status dropdowns, zoomable photographic evidence inspection, safe deletion, and campus student directory management with bulk ingestion.

| Administrator Login Portal | Admin Complaints Control Room |
| :---: | :---: |
| ![Admin Login](screenshots/05-admin-login.png) | ![Admin Dashboard](screenshots/06-admin-dashboard.png) |

| Interactive Grievance Evidence Modal | Enrolled Students Directory & Management |
| :---: | :---: |
| ![Complaint Detail & Evidence Modal](screenshots/07-complaint-detail-modal.png) | ![Enrolled Students Directory](screenshots/08-admin-students-tab.png) |

---

## 🌐 Production Deployment

The project is structured for immediate deployment on **Render** (Backend API) and **Vercel** (Frontend CDN).

### Step 1: Deploy Backend to Render

1. Create a new **Web Service** on [Render](https://render.com) connected to your GitHub repository.
2. Configure settings:
   * **Root Directory:** `backend`
   * **Environment:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
3. Add **Environment Variables** in Render dashboard:
   * `DATABASE_URL`: Your Neon PostgreSQL connection string.
   * `SESSION_SECRET`: A long random secret string.
   * `NODE_ENV`: `production`
   * `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://issuelens.vercel.app`).
   * `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
4. Render will start the service and provide an API URL (e.g. `https://issuelens-api.onrender.com`).

### Step 2: Deploy Frontend to Vercel

1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. In `frontend/js/api.js`, set `window.API_BASE` or update the fallback URL to your Render backend URL (`https://issuelens-api.onrender.com/api`).
4. Deploy! Vercel serves the static assets with high-speed global edge caching.

---

## 🛠️ Troubleshooting & FAQs

### 1. "Failed to fetch complaints" or Slow Initial Request
* **Cause:** Neon PostgreSQL serverless compute automatically suspends (sleeps) after 5 minutes of inactivity on free tier plans. Waking up the compute node (cold start) takes 5 to 9 seconds.
* **Solution:** The backend database pool (`backend/db.js`) is pre-configured with a 30-second connection timeout (`connectionTimeoutMillis: 30000`) and automatic transient query retry. Allow the serverless compute 5–8 seconds to wake up on the first query; subsequent queries will execute in under 300ms.

### 2. "Connection terminated unexpectedly" with Neon PgBouncer
* **Cause:** `node-postgres` (`pg`) does not support SCRAM channel binding when connecting through PgBouncer poolers.
* **Solution:** Ensure `&channel_binding=require` is removed from your `DATABASE_URL`. `backend/db.js` automatically sanitizes connection strings on startup.

### 3. Admin Deletion Takes 3–4 Seconds or Freezes
* **Cause:** Outdated backend code previously blocked the HTTP response awaiting Cloudinary API destruction.
* **Solution:** Upgrade to the latest `backend/routes/complaints.js`. Database records are now purged immediately and return HTTP 200 within ~200ms, while Cloudinary photo destruction proceeds in the background.

### 4. Cross-Domain Session Cookie Loss on Vercel + Render
* **Cause:** Modern browsers block third-party cookies unless `SameSite=None` and `Secure=true` are active.
* **Solution:** When `NODE_ENV=production` is set on Render, `server.js` automatically applies `sameSite: 'none'` and `secure: true`, while `app.set('trust proxy', 1)` enables cookies across reverse proxies.

---



## 🛠️ Troubleshooting & FAQs

### 1. "Failed to fetch complaints" or Slow Initial Request
* **Cause:** Neon PostgreSQL serverless compute automatically suspends (sleeps) after 5 minutes of inactivity on free tier plans. Waking up the compute node (cold start) takes 5 to 9 seconds.
* **Solution:** The backend database pool (`backend/db.js`) is pre-configured with a 30-second connection timeout (`connectionTimeoutMillis: 30000`) and automatic transient query retry. Allow the serverless compute 5–8 seconds to wake up on the first query; subsequent queries will execute in under 300ms.

### 2. "Connection terminated unexpectedly" with Neon PgBouncer
* **Cause:** `node-postgres` (`pg`) does not support SCRAM channel binding when connecting through PgBouncer poolers.
* **Solution:** Ensure `&channel_binding=require` is removed from your `DATABASE_URL`. `backend/db.js` automatically sanitizes connection strings on startup.

### 3. Admin Deletion Takes 3–4 Seconds or Freezes
* **Cause:** Outdated backend code previously blocked the HTTP response awaiting Cloudinary API destruction.
* **Solution:** Upgrade to the latest `backend/routes/complaints.js`. Database records are now purged immediately and return HTTP 200 within ~200ms, while Cloudinary photo destruction proceeds in the background.

### 4. Cross-Domain Session Cookie Loss on Vercel + Render
* **Cause:** Modern browsers block third-party cookies unless `SameSite=None` and `Secure=true` are active.
* **Solution:** When `NODE_ENV=production` is set on Render, `server.js` automatically applies `sameSite: 'none'` and `secure: true`, while `app.set('trust proxy', 1)` enables cookies across reverse proxies.

---
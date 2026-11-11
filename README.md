# 🎓 IssueLens — Campus Issue Reporting Portal

[![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-E34F26.svg)](#)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933.svg)](#)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-4169E1.svg)](#)
[![Storage](https://img.shields.io/badge/Media-Cloudinary-3448C5.svg)](#)

> A modern, transparent, and frictionless campus grievance and facility maintenance reporting system designed for university and college campuses.

---

## 📌 Overview

**IssueLens** replaces unorganized verbal complaints, WhatsApp messages, and physical paper logs with a streamlined digital platform. It connects students directly with campus administration to report infrastructure breakdowns, facility failures, and safety hazards in real-time with photographic evidence.

### 🌟 Key Highlights

* **Zero-Password Student Access:** Students authenticate seamlessly using their unique college **Enrollment Number (EN)** without the friction of remembering another password.
* **Photo Evidence Attachments:** Direct photo uploads for maintenance staff to accurately assess damage before dispatching technicians.
* **Real-Time Status Tracking:** Transparent status workflows (`Pending` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved`) keep students informed at all times.
* **Unified Admin Control Room:** Campus administrators can filter, search, review, update statuses, inspect evidence, and manage resolutions from a single responsive dashboard.
* **100% Free-Tier Architecture:** Engineered specifically for student and campus budgets using **Vercel** (Frontend), **Render** (Backend), **Neon** (Serverless PostgreSQL), and **Cloudinary** (Media CDN).

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Semantic markup, custom CSS design system (*DM Serif Display* + *DM Sans*), zero framework bloat |
| **Backend** | Node.js, Express.js | Modular RESTful API architecture with session-based security |
| **Database** | PostgreSQL (**Neon Serverless**) | High-performance relational database with connection pooling and SSL |
| **Media Storage** | **Cloudinary** | Permanent cloud-hosted storage and optimized CDN delivery for complaint photos |
| **Hosting** | **Render** & **Vercel** | Backend API deployed on Render; frontend static assets hosted on Vercel |

---

## 📸 Core Features

### 👩‍🎓 Student Portal
* **One-Click Authentication:** Log in with student Enrollment Number.
* **Personalized Dashboard:** Overview of total, pending, in-progress, and resolved complaints.
* **Fast Issue Reporting:** File grievances across categories (`⚡ Electricity`, `💧 Water`, `🧹 Cleanliness`, `📶 WiFi`, `🏫 Classroom`, `🏠 Hostel`, `📌 Other`).
* **Photo Uploads:** Drag-and-drop or select photo evidence with instant client-side preview.
* **Live Search:** Filter your submitted reports by status, category, or description keywords.

### 🛡️ Admin Panel
* **Secure Access:** Salted `bcryptjs` password hashing and role-based session authorization.
* **Global Analytics:** High-level metrics showing campus-wide resolution progress.
* **Advanced Multi-Filter Search:** Instantly narrow down complaints by status, category, student name, or EN number.
* **Interactive Evidence Inspector:** View high-resolution photos and complete student submissions in a modal dialog.
* **One-Click Status Updates:** Change statuses instantly via responsive inline dropdowns.
* **Safe Deletion:** Permanent deletion modal with confirmation checks.

---

## 📂 Project Structure

```
IssueLens/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # Student & admin authentication routes
│   │   ├── complaints.js    # Grievance CRUD, metrics, and upload handling
│   │   └── students.js      # Student record query and bulk ingestion APIs
│   ├── db.js                # Database connection pool manager
│   ├── package.json         # Backend dependencies & run scripts
│   ├── schema.sql           # Database schema and seed fixtures
│   ├── seed.js              # Standalone database initialization script
│   ├── server.js            # Main Express server entry point
│   └── uploads/             # Local test media storage folder
│
├── frontend/
│   ├── css/
│   │   └── styles.css       # Custom design system tokens and component styles
│   ├── js/
│   │   └── api.js           # Centralized API fetch client and UI helper functions
│   ├── pages/
│   │   ├── index.html              # Student login portal
│   │   ├── student-dashboard.html  # Student grievances dashboard
│   │   ├── submit-complaint.html   # Issue submission form
│   │   ├── admin-login.html        # Secure administrator login
│   │   └── admin-dashboard.html    # Admin management panel
│   └── index.html           # Root entry redirect
│
├── antigravity.md           # Master project context and architectural specification
├── package.json             # Root runner scripts
└── README.md                # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher recommended)
* [PostgreSQL](https://www.postgresql.org/) or a free [Neon](https://neon.tech) cloud database account
* A free [Cloudinary](https://cloudinary.com) account (for permanent photo storage)

### 1. Clone the Repository
```bash
git clone https://github.com/Rohan302006/IssueLens.git
cd IssueLens
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the `backend/` directory (you can copy `.env.example`):
```env
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_super_secret_session_key_here

# PostgreSQL / Neon Database URI
DATABASE_URL=postgresql://your_user:your_password@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Personal Admin Account (Seeded securely; never committed to Git)
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_NAME=Your Full Name (Admin)

# Cloudinary Credentials (Free Tier)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend origin (for CORS in production)
CLIENT_URL=http://localhost:5000
```

### 4. Initialize & Seed Database
Run the seed script to create all necessary tables and populate initial test students, admins, and complaints:
```bash
npm run seed
```

### 5. Launch the Application
```bash
# Start backend server
npm start

# Or with automatic reload during development:
npm run dev
```

Visit **`http://localhost:5000`** in your browser!

---

## 🔑 Demo Test Credentials

### 🛡️ Demo Administrator (For Testing & Verification)
| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `demo_admin` | `DemoAdmin@2026` | Admin | Pre-configured demo administrator account |

> **Note on Security:** Personal/official admin accounts are configured securely through your local `.env` file (`ADMIN_USERNAME` and `ADMIN_PASSWORD`). When running `npm run seed`, passwords are dynamically hashed using `bcrypt` and stored in PostgreSQL. Real passwords are never committed to the GitHub repository.

### 👩‍🎓 Demo Student Accounts (No password needed — log in with EN)
| Enrollment Number (EN) | Student Name | Department | Year |
| :--- | :--- | :--- | :--- |
| **`EN24991001`** | Aarav Sharma | Computer Science | 2nd Year |
| **`EN24991002`** | Ananya Verma | Information Technology | 3rd Year |
| **`EN24991003`** | Siddharth Rao | Mechanical Engineering | 1st Year |
| **`EN24991004`** | Diya Joshi | Civil Engineering | 4th Year |

*(You can also register any new student directly via the **Register as Student** link on the login page).*

---

## 🌐 Production Deployment

### 1. Backend on Render
1. Create a **New Web Service** connected to your GitHub repository.
2. Set **Root Directory** to `backend`.
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Under **Environment Variables**, add:
   * `DATABASE_URL`: Your Neon PostgreSQL connection string.
   * `SESSION_SECRET`: A secure random string.
   * `NODE_ENV`: `production`
   * `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   * `CLIENT_URL`: Your deployed Vercel URL (e.g. `https://issuelens.vercel.app`).

### 2. Frontend on Vercel
1. Import your repository into **Vercel**.
2. Set **Root Directory** to `frontend`.
3. In `frontend/js/api.js` (or via Vercel rewrites), direct the `API_BASE` endpoint to your Render backend URL.
4. Deploy!

---
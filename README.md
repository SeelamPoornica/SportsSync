# ⚡ SportSync — Sports Scheduler Web Application

A full-featured **Sports Session Scheduling** web application built with Node.js, Express.js, Sequelize ORM, PostgreSQL, and Passport.js. Organize sports sessions, find players, and manage games — all in one place.

---

## 🚀 Features

### Players
- **Sign Up / Sign In** — Secure registration and session-based authentication
- **Create Sessions** — Schedule sports games with venue, date/time, team players, and open slots
- **Join Sessions** — Browse available sessions and fill open player slots
- **Session Dashboard** — View sessions you created and sessions you joined
- **Cancel Sessions** — Cancel your own sessions with a reason (visible to joined players)
- **Overlap Detection** — Warning when joining sessions that conflict in time
- **Password Change** — Update account password from profile settings

### Admins (all player features plus)
- **Manage Sports** — Create and edit sport categories available for session creation
- **Analytics Reports** — View number of sessions played per sport over a configurable time window (7/14/30/60/90 days)
- **Cancel Any Session** — Admins can cancel sessions created by any user

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Template Engine | EJS |
| ORM | Sequelize v6 |
| Database | PostgreSQL (production), SQLite (testing) |
| Authentication | Passport.js (Local Strategy) |
| Password Hashing | bcryptjs |
| Sessions | express-session |
| CSRF Protection | csurf |
| Flash Messages | connect-flash |
| Testing | Jest + Supertest |
| Dev Tools | nodemon, dotenv, cross-env |

---

## 📁 Project Structure

```
sports-scheduler-app/
├── app.js                    # Entry point
├── config/
│   ├── config.js             # DB config (dev/test/prod)
│   └── passport.js           # Passport local strategy
├── models/
│   ├── index.js
│   ├── User.js               # name, email, passwordHash, role (admin|player)
│   ├── Sport.js              # name, createdById
│   ├── Session.js            # sportId, creatorId, dateTime, venue, teams, slots
│   └── SessionPlayer.js      # Join table: sessionId, userId
├── migrations/               # Sequelize migration files
├── seeders/                  # Admin user seeder
├── routes/
│   ├── index.js              # Landing + Dashboard
│   ├── auth.js               # Signup, Signin, Signout
│   ├── admin.js              # Sports management + Reports
│   ├── sessions.js           # Create, View, Join, Cancel sessions
│   └── profile.js            # Password settings
├── middleware/
│   └── auth.js               # ensureAuthenticated, ensureAdmin, ensureGuest
├── views/
│   ├── layout/               # Header & Footer partials
│   ├── auth/                 # signin.ejs, signup.ejs
│   ├── admin/                # sports.ejs, sport-form.ejs, reports.ejs
│   ├── sessions/             # create.ejs, detail.ejs
│   ├── profile/              # settings.ejs
│   ├── dashboard.ejs
│   ├── index.ejs
│   ├── 404.ejs
│   └── error.ejs
├── public/
│   ├── css/main.css          # Premium dark-mode stylesheet
│   └── js/main.js            # Client-side enhancements
└── __tests__/
    ├── auth.test.js
    └── sessions.test.js
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v16+
- PostgreSQL (v13+ recommended)
- npm

### 1. Clone / Navigate to the Project

```bash
cd sports-scheduler-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example env file and fill in your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=development

# PostgreSQL database credentials
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=sports_scheduler
DB_HOST=127.0.0.1
DB_PORT=5432

# Session secret (change in production!)
SESSION_SECRET=your_super_secret_key

# Admin seeder credentials
ADMIN_EMAIL=admin@sports.com
ADMIN_PASSWORD=Admin@1234
```

### 4. Create the PostgreSQL Database

```sql
CREATE DATABASE sports_scheduler;
```

### 5. Run Migrations

```bash
npm run db:migrate
```

### 6. Seed the Admin User

```bash
npm run db:seed
```

### 7. Start the Application

**Development (with hot-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**In-memory mode (no PostgreSQL needed):**
```bash
npm run dev:mem
```

Open your browser to: **http://localhost:3000**

---

## 👤 Default Admin Credentials

After seeding:

| Field | Value |
|-------|-------|
| Email | `admin@sports.com` |
| Password | `Admin@1234` |

> ⚠️ Change these in your `.env` before seeding in production!

---

## 🧪 Running Tests

Tests use SQLite in-memory (no PostgreSQL required):

```bash
npm test
```

Tests cover:
- Auth: signup validation, signin, duplicate email, protected routes
- Sessions: creation, past-date rejection
- Admin: sports management, reports, role access control

---

## 📜 NPM Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start app with Node.js |
| `npm run dev` | Start with nodemon (hot-reload) |
| `npm run dev:mem` | Start with pg-mem in-memory DB |
| `npm run build` | Run database migrations |
| `npm run db:migrate` | Run all pending migrations |
| `npm run db:migrate:undo` | Undo all migrations |
| `npm run db:seed` | Seed admin user |
| `npm test` | Run Jest test suite |

---

## 🔒 Security Features

- **Bcrypt** password hashing (salt rounds: 12)
- **CSRF tokens** on all forms (via `csurf`)
- **Session-based** authentication with `express-session`
- **Role-based** access control (Admin vs Player)
- **Input validation** on all forms server-side
- **Past session** join prevention
- **Duplicate join** prevention

---

## 📄 License

MIT — feel free to use and modify for your projects.

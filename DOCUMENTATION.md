# Exam Portal - Complete Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [System Requirements](#4-system-requirements)
5. [Installation & Setup](#5-installation--setup)
6. [Environment Configuration](#6-environment-configuration)
7. [Starting the Server](#7-starting-the-server)
8. [Admin Guide](#8-admin-guide)
9. [Candidate (Student) Flow](#9-candidate-student-flow)
10. [Anti-Cheat System](#10-anti-cheat-system)
11. [AI Proctoring](#11-ai-proctoring)
12. [Question Randomization](#12-question-randomization)
13. [Security Architecture](#13-security-architecture)
14. [Database Schema](#14-database-schema)
15. [API Reference](#15-api-reference)
16. [WebSocket Events (Real-Time)](#16-websocket-events-real-time)
17. [Docker & Production Deployment](#17-docker--production-deployment)
18. [Network / LAN Deployment](#18-network--lan-deployment)
19. [Troubleshooting](#19-troubleshooting)
20. [FAQ](#20-faq)

---

## 1. Project Overview

A browser-based **Computer-Based Test (CBT)** platform designed for office and LAN environments. It delivers a JEE-style exam interface with MCQ and subjective questions, real-time admin monitoring, multi-layered anti-cheat detection, and optional AI-powered webcam proctoring.

### Key Features

| Feature | Description |
|---------|-------------|
| Candidate Registration | Students register with name, email, phone, and exam code |
| JEE-Style Exam UI | Question navigator, countdown timer, mark for review, save & next |
| MCQ + Subjective | Supports multiple choice (A/B/C/D) and free-text (rich HTML) answer types |
| Fixed 60-Minute Duration | All exams are 60 minutes with automatic submission at timer expiry |
| Question Randomization | Each candidate gets a unique question order and shuffled MCQ option positions |
| Fullscreen Enforcement | Exam launches in fullscreen mode; exits are detected and logged |
| Tab Switch Detection | Switching tabs or minimizing triggers a violation alert |
| Keyboard Restrictions | Blocks copy/paste, new tab, dev tools, and other shortcuts |
| Screenshot Deterrence | Dynamic watermark overlay with candidate name, ID, IP, and live timestamp |
| AI Cheating Detection | Optional webcam-based face detection, head pose, and phone detection |
| Auto-Save | MCQ answers save instantly; subjective answers auto-save after 900ms of idle typing |
| Admin Dashboard | Create exams, upload questions (manual + XLSX bulk import), monitor live, grade answers |
| Result Analytics | Per-exam statistics, per-question accuracy, CSV export, subjective grading panel |
| Real-Time Monitoring | Socket.IO WebSocket pushes live updates to admin dashboard |
| Back-Button Protection | Three-layer redirect system prevents re-entering a submitted exam |
| Session Resumption | If a candidate's browser crashes, they can re-register with the same email+phone to resume |
| Local Network Ready | Runs entirely on office WiFi/LAN — no internet required |

### Architecture Diagram

```
 Students (Browser)                    Admin (Browser)
       |                                     |
  Office WiFi / LAN ─────────────────────────┘
       |
  Exam Server Machine (e.g. 192.168.x.x)
       |
  ┌────────────┐    ┌────────────┐    ┌─────────────────┐
  │  Frontend   │    │  Backend   │    │  AI Proctor     │
  │  React/Vite │◄──►│  Express   │◄──►│  Python/FastAPI  │
  │  Port 4173  │    │  Port 8080 │    │  Port 8090       │
  └────────────┘    └─────┬──────┘    └─────────────────┘
                          │                (optional)
                    ┌─────┴──────┐
                    │ PostgreSQL │
                    │ Port 5432  │
                    └────────────┘
```

**Data flow:**
1. Students open the frontend URL in their browser
2. Frontend makes REST API calls to the backend
3. Backend reads/writes data to PostgreSQL via Prisma ORM
4. Backend emits real-time events to admin via Socket.IO
5. (Optional) Frontend captures webcam frames → Backend forwards to AI Proctor → Violations stored in DB

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, TypeScript | Single-page application |
| Build Tool | Vite | Fast dev server & production builds |
| Styling | TailwindCSS | Utility-first CSS framework |
| Rich Text Editor | Tiptap | Subjective answer input (rich HTML) |
| Math Rendering | KaTeX | Renders LaTeX math in question prompts |
| Data Fetching | TanStack Query (React Query) | Server state management with caching |
| Routing | React Router v6 | Client-side page navigation |
| Backend | Node.js, Express, TypeScript | REST API server |
| ORM | Prisma | Type-safe database queries & migrations |
| Database | PostgreSQL 16 | Relational data storage |
| Real-time | Socket.IO | WebSocket-based live event streaming |
| AI Proctoring | Python 3.10+, FastAPI | Webcam frame analysis microservice |
| Computer Vision | MediaPipe, OpenCV, NumPy | Face detection & head pose estimation |
| Image Processing | Pillow (PIL) | JPEG decode for webcam frames |
| Authentication | JSON Web Tokens (JWT) | Stateless auth via HTTP-only cookies |
| Validation | Zod | Schema validation shared between frontend & backend |
| Monorepo | npm Workspaces | Manages apps/, packages/, services/ |
| Reverse Proxy | Nginx | Production load balancing & routing |
| Containerization | Docker, Docker Compose | Production deployment |

---

## 3. Project Structure

```
Exam Portal/
├── apps/
│   ├── api/                          # Backend Express API
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema definition
│   │   │   ├── seed.ts               # Admin user seeder
│   │   │   └── seed-test-exam.ts     # Test data seeder
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── admin-auth/       # Admin login/logout/session
│   │   │   │   ├── admin-exams/      # Exam CRUD, questions, import
│   │   │   │   ├── analytics/        # Overview & per-exam stats
│   │   │   │   ├── candidate-sessions/ # Registration, start, runtime, submit
│   │   │   │   ├── monitoring/       # Live session & violation feeds
│   │   │   │   ├── responses/        # Answer save/update
│   │   │   │   ├── results/          # Grading, export, result sync
│   │   │   │   ├── uploads/          # File/image asset uploads
│   │   │   │   └── violations/       # Violation reporting & AI proctor frames
│   │   │   ├── middleware/           # Auth guards (requireAdmin, requireCandidate)
│   │   │   ├── lib/                  # Prisma client, realtime server
│   │   │   ├── utils/                # DTO mappers, shuffle helpers
│   │   │   ├── app.ts               # Express app setup (CORS, routes, middleware)
│   │   │   ├── env.ts               # Environment variable loader
│   │   │   └── index.ts             # Server entry point
│   │   ├── scripts/
│   │   │   └── run-tests.mjs        # API integration test suite
│   │   └── package.json
│   │
│   └── frontend/                     # React Frontend
│       ├── src/
│       │   ├── features/
│       │   │   ├── admin/            # Admin dashboard, exam manager, monitoring
│       │   │   │   ├── components/   # ExamManager, MonitoringPanel, GradingPanel, etc.
│       │   │   │   └── pages/        # AdminDashboardPage, AdminLoginPage
│       │   │   ├── candidate/        # Student registration & instructions
│       │   │   │   └── pages/        # CandidateRegistrationPage, ExamInstructionsPage
│       │   │   └── exam/             # Live exam runtime
│       │   │       ├── components/   # QuestionCard, QuestionNavigator, WatermarkOverlay
│       │   │       ├── hooks/        # useAntiCheat, useWebcamProctor
│       │   │       └── pages/        # ExamRuntimePage, ResultPage
│       │   ├── components/ui/        # Reusable UI components (Button, Card, Input, etc.)
│       │   ├── api/                  # API client wrapper (axios)
│       │   ├── app/                  # React Router route definitions
│       │   └── main.tsx              # App entry point
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared code between frontend & backend
│       └── src/
│           ├── types.ts              # TypeScript interfaces (DTOs)
│           └── schemas.ts            # Zod validation schemas
│
├── services/
│   └── ai-proctor/                   # Python AI Proctoring Service
│       ├── app.py                    # FastAPI application
│       ├── requirements.txt          # Python dependencies
│       └── Dockerfile
│
├── database/
│   └── schema.sql                    # Raw SQL schema (reference snapshot)
│
├── infra/
│   └── nginx/
│       └── default.conf              # Nginx reverse proxy config
│
├── .env                              # Environment configuration
├── start.bat                         # One-click Windows server launcher
├── docker-compose.yml                # Docker production setup
├── package.json                      # Root workspace config & scripts
├── DOCUMENTATION.md                  # This file
└── tsconfig.json
```

### Monorepo Workspaces

The project uses **npm workspaces** to manage three workspace roots:

| Workspace | Package Name | Path |
|-----------|-------------|------|
| Backend API | `@exam-platform/api` | `apps/api` |
| Frontend | `@exam-platform/frontend` | `apps/frontend` |
| Shared Types | `@exam-platform/shared` | `packages/shared` |

### Frontend Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | (redirect) | Redirects to `/exam` |
| `/exam` | CandidateRegistrationPage | Student registration form |
| `/exam/:sessionId/instructions` | ExamInstructionsPage | Pre-exam instructions & start button |
| `/exam/:sessionId/runtime` | ExamRuntimePage | Live exam with timer, questions, navigator |
| `/exam/:sessionId/result` | ResultPage | Post-submission confirmation |
| `/admin/login` | AdminLoginPage | Admin login form |
| `/admin` | AdminDashboardPage | Admin dashboard (tabbed interface) |

### API Route Prefixes

| Prefix | Router | Auth |
|--------|--------|------|
| `/api/health` | Health check | None |
| `/api/auth` | Admin auth (login/logout/me) | None / Admin |
| `/api/admin/exams` | Exam CRUD + questions | Admin |
| `/api/admin/analytics` | Stats & metrics | Admin |
| `/api/admin/monitoring` | Live sessions & violations | Admin |
| `/api/admin/results` | Grading & export | Admin |
| `/api/admin/uploads` | File uploads | Admin |
| `/api/candidate-sessions` | Registration, start, runtime, submit | None / Candidate |
| `/api/responses` | Answer save/update | Candidate |
| `/api/violations` | Violation reporting | Candidate / Bearer |

### npm Scripts (Root)

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev:api` | `tsx watch src/index.ts` | Start API dev server with hot reload |
| `npm run dev:frontend` | `vite` | Start frontend dev server |
| `npm run build` | Build shared → API → frontend | Full production build |
| `npm test` | `run-tests.mjs` | Run API integration tests |
| `npm run prisma:generate` | `prisma generate` | Generate Prisma client |
| `npm run prisma:push` | `prisma db push` | Push schema to database |
| `npm run prisma:seed` | `prisma db seed` | Seed admin user |

---

## 4. System Requirements

### Hardware (for 100-150 simultaneous students)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Storage | 256 GB SSD | 512 GB SSD |
| Network | 100 Mbps LAN | 1 Gbps LAN |
| GPU | Not required | Recommended if AI proctoring enabled |

### Software Requirements

| Software | Version | Required? |
|----------|---------|-----------|
| Node.js | 18+ (recommended: 22) | Yes |
| npm | 9+ | Yes |
| PostgreSQL | 16+ | Yes |
| Python | 3.10 - 3.13 | Only if AI proctoring enabled |
| pip | Latest | Only if AI proctoring enabled |

### Browser Requirements (Students)

| Browser | Minimum Version |
|---------|----------------|
| Google Chrome | 90+ (recommended) |
| Microsoft Edge | 90+ |
| Mozilla Firefox | 90+ |
| Safari | 15+ |

> **Note:** Students must allow fullscreen and (if AI proctoring enabled) webcam permissions.

---

## 5. Installation & Setup

### Step 1: Clone or Extract the Project

Place the project folder on the exam server machine.

### Step 2: Install Node.js Dependencies

```bash
npm install
```

This installs dependencies for all workspaces (API, frontend, shared).

### Step 3: Create the Database

Open pgAdmin or psql and create the database:

```sql
CREATE DATABASE exam_platform;
```

### Step 4: Configure Environment

Copy and edit the `.env` file in the project root (see [Section 6](#6-environment-configuration) for full details):

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/exam_platform?schema=public
JWT_SECRET=your-secret-key-min-16-chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourAdminPassword123!
```

### Step 5: Initialize Database Schema

```bash
# Generate Prisma client code
npm run prisma:generate

# Create all tables in the database
npm run prisma:push

# Create the admin user
npm run prisma:seed
```

### Step 6: (Optional) Setup AI Proctoring

Only needed if you want webcam-based cheating detection:

```bash
cd services/ai-proctor
pip install -r requirements.txt
```

Then set `ENABLE_AI_PROCTORING=true` in `.env`.

### Step 7: Verify Installation

```bash
# Run the test suite
npm test
```

Expected output: `All 3 tests passed`

---

## 6. Environment Configuration

The `.env` file in the project root controls all configuration. The same file is read by both the API and the `start.bat` launcher.

### Complete Variable Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `APP_ORIGIN` | URL | `http://localhost:4173` | Frontend URL. Used for CORS `Access-Control-Allow-Origin`. For LAN, set to `http://<server-ip>:4173` or `http://<server-ip>` if using Nginx. |
| `FRONTEND_PORT` | Number | `4173` | Port the frontend dev server listens on |
| `API_PORT` | Number | `8080` | Port the backend API listens on |
| `VITE_API_URL` | URL | `http://localhost:8080/api` | Full base URL for API calls from the frontend. Must include `/api` suffix. For LAN: `http://<server-ip>:8080/api` |
| `DATABASE_URL` | Connection String | — | PostgreSQL connection URL in format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public` |
| `JWT_SECRET` | String | — | **Must change.** Secret key for signing JWT tokens. Minimum 16 characters. Use a random string. |
| `PROCTOR_API_TOKEN` | String | — | **Must change.** Bearer token the AI proctor uses to authenticate with the API. Minimum 8 characters. |
| `ADMIN_USERNAME` | String | `admin` | Username for admin login |
| `ADMIN_PASSWORD` | String | — | **Must change.** Password for admin login. Minimum 8 characters. |
| `UPLOADS_DIR` | Path | `./apps/api/uploads` | Directory where uploaded question assets (images) are stored |
| `PROCTOR_SERVICE_URL` | URL | `http://localhost:8090` | Internal URL of the AI proctor Python service |
| `ENABLE_AI_PROCTORING` | Boolean | `false` | `true` = enable webcam AI analysis, `false` = skip AI (webcam still opens for deterrence) |

### Example: Local Development

```env
APP_ORIGIN=http://localhost:4173
FRONTEND_PORT=4173
API_PORT=8080
VITE_API_URL=http://localhost:8080/api
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/exam_platform?schema=public
JWT_SECRET=my-local-dev-secret-key-32chars
PROCTOR_API_TOKEN=local-proctor-token
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@123
UPLOADS_DIR=./apps/api/uploads
PROCTOR_SERVICE_URL=http://localhost:8090
ENABLE_AI_PROCTORING=false
```

### Example: LAN Deployment (Server IP: 192.168.1.10)

```env
APP_ORIGIN=http://192.168.1.10:4173
FRONTEND_PORT=4173
API_PORT=8080
VITE_API_URL=http://192.168.1.10:8080/api
DATABASE_URL=postgresql://postgres:StrongProdPassword@localhost:5432/exam_platform?schema=public
JWT_SECRET=a7f3b9c1d4e8f2a6b0c5d9e3f7a1b4c8
PROCTOR_API_TOKEN=prod-proctor-secure-token
ADMIN_USERNAME=examadmin
ADMIN_PASSWORD=SecureExam@2026!
UPLOADS_DIR=./apps/api/uploads
PROCTOR_SERVICE_URL=http://localhost:8090
ENABLE_AI_PROCTORING=true
```

---

## 7. Starting the Server

### Option A: One-Click Start (Windows)

Double-click **`start.bat`** in the project root. It automatically:

1. Checks if PostgreSQL is running on port 5432
2. Opens a new terminal window for the **Backend API** (port 8080)
3. Opens a new terminal window for the **Frontend** (port 4173)
4. Reads `ENABLE_AI_PROCTORING` from `.env`:
   - If `true`: opens a new terminal for the **AI Proctor** (port 8090)
   - If `false`: skips the AI proctor (prints "DISABLED")

Each service runs in its own cmd window. Close the windows to stop the servers.

### Option B: Manual Start (Any OS)

Open separate terminals:

```bash
# Terminal 1: Backend API
npm run dev:api

# Terminal 2: Frontend
npm run dev:frontend

# Terminal 3: AI Proctor (only if ENABLE_AI_PROCTORING=true)
cd services/ai-proctor
python -m uvicorn app:app --host 0.0.0.0 --port 8090
```

### Option C: Docker (Production)

```bash
# Without AI proctoring
docker-compose up -d

# With AI proctoring
docker-compose --profile ai up -d
```

### Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Student Exam Page | `http://localhost:4173/exam` | Where students register and take exams |
| Admin Dashboard | `http://localhost:4173/admin` | Admin management interface |
| Admin Login | `http://localhost:4173/admin/login` | Admin authentication |
| API Health Check | `http://localhost:8080/api/health` | Returns `{"status":"ok"}` |
| AI Proctor Health | `http://localhost:8090/health` | Returns `{"status":"ok","mediapipe":"available"}` |

> **Important:** Before running `start.bat` again, close all previous server windows first. If you see `EADDRINUSE` errors, it means the port is still occupied by a previous instance.

---

## 8. Admin Guide

### 8.1 Logging In

1. Open `http://localhost:4173/admin/login` (or `http://<server-ip>:4173/admin/login` on LAN)
2. Enter the `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env`
3. A JWT token is set as an HTTP-only cookie (`admin_session`, valid for 8 hours)
4. You are redirected to the admin dashboard

### 8.2 Dashboard Tabs

The admin dashboard is organized into five tabs:

| Tab | Icon | Purpose |
|-----|------|---------|
| **Overview** | Chart | System-wide statistics: total exams, live sessions, completed, pending reviews |
| **Exam Manager** | File | Create exams, add/edit/import questions, start/stop exams, export results |
| **Monitoring** | Eye | Real-time view of all candidate sessions, violation feed, heartbeat status |
| **Pending Reviews** | CheckCircle | Grade subjective answers, award marks, add remarks |
| **Analytics** | BarChart | Per-exam statistics: submission count, average score, per-question accuracy |

### 8.3 Creating an Exam

1. Go to the **Exam Manager** tab
2. In the "Create New Exam" form, fill in:

| Field | Description | Validation |
|-------|-------------|------------|
| **Exam Title** | Name of the exam (e.g., "Physics Final Test") | 3-200 characters |
| **Exam Code** | Unique join code students use (e.g., "PHY-001") | 4-32 characters, auto-uppercased |
| **Total Marks** | Maximum possible score | Positive integer |
| **Instructions** | HTML instructions shown before exam starts | Min 10 characters |

3. Click **Create Exam**
4. The exam is created in **Draft** status
5. Duration is automatically set to **60 minutes** (not configurable)

### 8.4 Adding Questions

#### Method 1: Manual Entry (Question Composer)

1. Select an exam from the **Exam List** (click its card)
2. Scroll to the **Question Composer** section
3. Choose question type:

**For MCQ:**

| Field | Description |
|-------|-------------|
| Question Prompt | The question text (supports HTML, KaTeX math) |
| Option A | First choice |
| Option B | Second choice |
| Option C | Third choice |
| Option D | Fourth choice |
| Correct Answer | A, B, C, or D |
| Marks | Points for correct answer |
| Sort Order | Display position (1, 2, 3...) |

**For Subjective:**

| Field | Description |
|-------|-------------|
| Question Prompt | The question text (supports HTML) |
| Marks | Maximum points |
| Sort Order | Display position |

4. Click **Add Question**
5. The question appears in the exam's question list

#### Method 2: Bulk Import (XLSX Spreadsheet)

1. Select an exam from the Exam List
2. Scroll to the **Import Questions** section
3. Prepare an Excel file (`.xlsx`) with these columns:

| Column | Required | Values |
|--------|----------|--------|
| `type` | Yes | `mcq` or `subjective` |
| `promptHtml` | Yes | Question text (can include HTML tags) |
| `optionAHtml` | MCQ only | Option A text |
| `optionBHtml` | MCQ only | Option B text |
| `optionCHtml` | MCQ only | Option C text |
| `optionDHtml` | MCQ only | Option D text |
| `correctOption` | MCQ only | `A`, `B`, `C`, or `D` |
| `marks` | Yes | Points (integer) |
| `sortOrder` | Yes | Display order (1, 2, 3...) |
| `assetFilename` | No | Image filename (e.g., `diagram.png`) |

4. Optionally prepare a **ZIP file** containing image assets referenced in `assetFilename`
5. Upload both files and click **Import**

> **Warning:** Importing **replaces all existing questions** for that exam.

### 8.5 Editing & Deleting Questions

After adding questions to an exam, you can edit or delete them directly from the question list.

#### Editing a Question

1. Select the exam from the **Exam List**
2. In the **Current Questions** panel, find the question you want to edit
3. Click the **pencil icon** (edit button) on the right side of the question
4. The **Question Composer** section below scrolls into view and switches to **Edit Mode**:
   - The heading changes to "Edit Question"
   - All fields are pre-filled with the question's current values
   - A **Cancel Edit** button appears in the top-right corner
5. Modify any fields: prompt, options, correct answer, marks, sort order, asset URL, or even change the type (MCQ to subjective or vice versa)
6. Click **Update Question** to save changes
7. The question list refreshes automatically to show the updated content

#### Deleting a Question

1. Click the **trash icon** (delete button) on the question you want to remove
2. A **confirmation step** appears: a checkmark (confirm) and X (cancel) icon replace the trash icon
3. Click the **checkmark** to permanently delete the question, or **X** to cancel
4. The question count updates automatically after deletion

> **Note:** Editing or deleting questions while an exam is live is technically possible but not recommended, as it may affect in-progress candidate sessions.

### 8.6 Exam Lifecycle

```
  ┌───────┐     Start      ┌──────┐     Stop       ┌─────────┐
  │ Draft │──────────────►│ Live │──────────────►│ Stopped │
  └───────┘                └──────┘                └─────────┘
                              │                        │
                              │ Students can            │ All active sessions
                              │ register & take         │ auto-submitted & graded
                              │ the exam                │ No new registrations
```

| Action | What Happens |
|--------|-------------|
| **Create Exam** | Exam enters `draft` status. Add questions and configure. |
| **Start Exam** | Status becomes `live`. Students can register with the exam code and take the exam. Share the exam code with students. |
| **Stop Exam** | Status becomes `stopped`. All active `in_progress` sessions are automatically submitted. MCQ answers are auto-graded. No new registrations allowed. |
| **Delete Exam** | Permanently removes the exam, all questions, sessions, responses, violations, and results. Cannot delete a `live` exam — stop it first. |

### 8.6 Live Monitoring

The **Monitoring** tab provides real-time visibility into all active exams:

**Session Table Columns:**

| Column | Description |
|--------|-------------|
| Candidate ID | Unique ID (e.g., `CAND-2026-001`) |
| Name | Student's full name |
| Exam | Which exam they're taking |
| Status | `registered` / `in_progress` / `submitted` / `expired` / `stopped` |
| Violations | Total number of anti-cheat violations |
| Latest Violation | Most recent violation type and timestamp |
| Heartbeat | Time since last heartbeat (healthy = within 10s) |

**Violation Feed:**
- Shows a scrolling list of all violations across all sessions
- Each entry shows: timestamp, candidate name, violation type, severity badge
- Updates in real-time via Socket.IO — no need to refresh

### 8.7 Grading Subjective Answers

1. Go to the **Pending Reviews** tab
2. Each pending item shows:
   - Student name and Candidate ID
   - The question prompt
   - The student's typed answer (rendered HTML)
   - Maximum marks for the question
3. Enter **Awarded Marks** (0 to maximum)
4. Optionally add **Remarks** (feedback for the student)
5. Click **Save Score**
6. When all subjective answers for a student are graded:
   - `subjectiveScore` is calculated
   - `totalScore` = `mcqScore` + `subjectiveScore`
   - `finalizedAt` is set (result is finalized)

### 8.8 Exporting Results (CSV)

1. Select an exam in the **Exam Manager**
2. Click **Export Results**
3. Downloads a CSV file with these columns:

| CSV Column | Description |
|------------|-------------|
| `candidateId` | Unique candidate identifier |
| `candidateName` | Full name |
| `email` | Email address |
| `phone` | Phone number |
| `examTitle` | Exam name |
| `status` | Session status |
| `mcqScore` | Auto-graded MCQ score |
| `subjectiveScore` | Admin-graded subjective score |
| `totalScore` | Combined total |
| `finalizedAt` | When grading was completed |

### 8.9 Publishing Results

Results are published when the admin finalizes grading. Students can view their result on the result page (they see it after submission, and scores update once graded).

### 8.10 Deleting an Exam

1. Stop the exam first (cannot delete a live exam)
2. Click **Delete Exam** on the exam card
3. Confirm the deletion
4. This **permanently removes** the exam and all associated data (questions, sessions, responses, violations, results)

---

## 9. Candidate (Student) Flow

### Step 1: Registration

1. Open `http://<server-ip>:4173/exam` in a web browser
2. Fill in the registration form:

| Field | Rules |
|-------|-------|
| **Full Name** | 2-120 characters |
| **Email** | Valid email format |
| **Phone** | 6-20 characters |
| **Exam Code** | Provided by admin (case-insensitive, e.g., "phy-001" or "PHY-001") |

3. Click **Continue to Instructions**
4. The system:
   - Validates the exam code and checks the exam is `live`
   - Generates a unique Candidate ID (e.g., `CAND-2026-001`)
   - Creates a session with `registered` status
   - Records the student's IP address
   - Sets a `candidate_session` JWT cookie (valid 12 hours)

**Session Resumption:** If the same email + phone combination already has an active session for this exam (e.g., after a browser crash), the existing session is resumed instead of creating a new one.

### Step 2: Instructions Page

Shows the following information:

| Item | Source |
|------|--------|
| Exam Title | From exam settings |
| Duration | Fixed: 60 minutes |
| Total Marks | From exam settings |
| Question Count | Number of questions in the exam |
| Important Rules | Built-in rules (fullscreen, no tab switching, etc.) |
| Custom Instructions | HTML instructions set by admin |

Click **Start Exam** to begin the timer.

### Step 3: The Exam Interface

```
┌────────────────────────────────────────────────────────────┐
│  Candidate                         Time Remaining          │
│  John Doe                          00:58:32                │
│  CAND-2026-001                     (pulses red < 5 min)    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Q3. What is the acceleration due to gravity on Earth?     │
│                                                            │
│  ○ A) 8.9 m/s²                                            │
│  ● B) 9.8 m/s²          ← selected (highlighted)          │
│  ○ C) 10.8 m/s²                                           │
│  ○ D) 11.2 m/s²                                           │
│                                                            │
│  [Image/diagram if attached]                               │
│                                                            │
├────────────────────────────────────┬───────────────────────┤
│  [Save & Next] [Mark for Review]  │  Question Navigator    │
│  [Clear Response] [Submit Exam]   │                        │
│                                   │  [1] [2] [3] [4] [5]  │
│                                   │  [6] [7] [8] [9] [10] │
│                                   │                        │
│                                   │  ■ Green  = Answered   │
│                                   │  ■ Red    = Unanswered │
│                                   │  ■ Blue   = Review     │
│                                   │  □ White  = Not visited │
└───────────────────────────────────┴───────────────────────┘
│         WATERMARK: John Doe | CAND-2026-001 | 192.168.1.50│
│                   2026-04-12 10:32:45                      │
└────────────────────────────────────────────────────────────┘
```

### Exam Controls

| Button | Action | Keyboard |
|--------|--------|----------|
| **Save & Next** | Saves current answer, moves to next question | — |
| **Mark for Review** | Flags question (blue in navigator), saves, moves to next | — |
| **Clear Response** | Removes selected option or typed answer for current question | — |
| **Submit Exam** | Shows inline confirmation dialog → submits on confirm | — |
| **Question Number** | Click any number in the navigator to jump to that question | — |

### Auto Features

| Feature | Behavior |
|---------|----------|
| **Auto-save (MCQ)** | Clicking an option instantly saves to the server |
| **Auto-save (Subjective)** | Saves after 900ms of no typing (debounced) |
| **Auto-submit** | When the 60-minute timer reaches `00:00:00`, the exam auto-submits |
| **Heartbeat** | Every 10 seconds, the client pings the server with the current question ID |
| **Fullscreen** | Exam auto-enters fullscreen on load; re-requests if exited |
| **Low Time Warning** | Timer turns red and pulses when < 5 minutes remain |

### Step 4: After Submission

After submitting (manually or auto-submit):

1. Student sees a **result confirmation page** with:
   - "Exam submitted successfully" message
   - Their Candidate ID for reference
   - "Please wait for results from the administrator"
2. **Browser back button** is blocked — pressing back redirects to the result page (not back to the exam)
3. The session cannot be re-entered or resumed

### Session Statuses

| Status | Meaning |
|--------|---------|
| `registered` | Student registered but hasn't started the exam yet |
| `in_progress` | Exam is active, timer is counting down |
| `submitted` | Student submitted (manually or auto-submit at timer=0) |
| `expired` | Timer expired and system auto-submitted |
| `stopped` | Admin stopped the exam while student was in progress |

---

## 10. Anti-Cheat System

The anti-cheat system operates on the client side (browser) and detects suspicious behavior during the exam. All violations are sent to the server and visible in the admin Monitoring tab.

### Detection Matrix

| Behavior | Violation Type | Severity | Action |
|----------|---------------|----------|--------|
| Switch to another tab/window | `tab_switch` | Warning | Logged + warning banner shown for 3.5s |
| Exit fullscreen mode | `fullscreen_exit` | Warning | Logged + warning banner + fullscreen re-requested |
| Right-click (context menu) | `right_click` | Info | Event blocked + logged |
| Ctrl+C (copy) | `blocked_shortcut` | Warning | Event blocked + logged |
| Ctrl+V (paste) | `blocked_shortcut` | Warning | Event blocked + logged |
| Ctrl+T (new tab) | `blocked_shortcut` | Warning | Event blocked + logged |
| Ctrl+W (close tab) | `blocked_shortcut` | Warning | Event blocked + logged |
| Ctrl+Tab (switch tab) | `blocked_shortcut` | Warning | Event blocked + logged |
| F12 (developer tools) | `blocked_shortcut` | Warning | Event blocked + logged |
| Page refresh/navigate away | `reload_attempt` | Info | Logged (beforeunload event) |
| Heartbeat gap > 20 seconds | `heartbeat_gap` | Info | Logged server-side |
| IP address changed mid-exam | `ip_change` | Warning | Logged server-side |

### Violation Throttling

To prevent flooding the server, each violation type is **throttled to one report per 2.5 seconds**. If a student rapidly switches tabs 10 times, only ~4 violations are logged.

### Warning Banner

When a violation occurs, a red banner appears at the top of the exam screen:

> **"⚠ Tab switch detected. This has been reported."**

The banner auto-dismisses after 3.5 seconds.

### Screenshot Deterrence (Watermark)

A semi-transparent watermark overlay covers the entire exam screen. It displays:

- Candidate's full name
- Candidate ID (e.g., `CAND-2026-001`)
- IP address
- Live timestamp (updates every second)

This makes any screenshot traceable to the specific candidate, time, and device.

### What Cannot Be Blocked

Some actions cannot be intercepted by browser JavaScript:

| Action | Reason |
|--------|--------|
| Alt+Tab (OS-level window switch) | Operating system shortcut — not accessible to browser |
| Win key / Super key | OS-level shortcut |
| Print Screen (hardware) | Captured at OS level; watermark provides deterrence |
| Taking a photo of the screen | Physical action; watermark provides deterrence |
| Using a second device | Not detectable without network restrictions |

### Server-Side Detections

| Detection | How It Works |
|-----------|-------------|
| **Heartbeat Gap** | Client sends heartbeat every 10s. If server sees a gap > 20s, a `heartbeat_gap` violation is created. This can indicate: network issues, browser crash, student using Task Manager to kill browser, or VPN disconnect. |
| **IP Change** | Server compares the IP address on each heartbeat with the session's registered IP. If it changes (e.g., VPN toggle, WiFi reconnect to different network), an `ip_change` violation is created. |

---

## 11. AI Proctoring

### Overview

When `ENABLE_AI_PROCTORING=true`, the system uses the student's webcam to detect cheating behaviors in real-time. A separate Python microservice (FastAPI + MediaPipe) analyzes webcam frames.

### How It Works (End to End)

```
Student's Browser                    Backend API                  AI Proctor Service
     │                                    │                              │
     │ 1. getUserMedia() opens webcam     │                              │
     │                                    │                              │
     │ 2. Every 15 seconds:               │                              │
     │    Capture frame (320x240, JPEG)   │                              │
     │    Convert to base64               │                              │
     │                                    │                              │
     │ 3. POST /api/violations/           │                              │
     │    proctor-frame                   │                              │
     │    { sessionId, imageBase64 }      │                              │
     │                                    │ 4. POST /analyze-frame       │
     │                                    │    { session_id, image_b64 } │
     │                                    │                              │
     │                                    │    5. MediaPipe face detect   │
     │                                    │    6. Head pose estimation    │
     │                                    │    7. Return violations[]     │
     │                                    │◄─────────────────────────────│
     │                                    │                              │
     │                                    │ 8. Create violation records   │
     │                                    │    in database                │
     │                                    │                              │
     │                                    │ 9. Emit Socket.IO event      │
     │                                    │    to admin dashboard         │
     │◄───────────────────────────────────│                              │
     │ 10. Response: { created: [...] }   │                              │
```

### AI Detections

| Behavior | Violation Type | Severity | Detection Method |
|----------|---------------|----------|------------------|
| No face visible in frame | `no_face` | Warning | MediaPipe face detection finds 0 faces |
| Multiple faces in frame | `multiple_faces` | Critical | MediaPipe face detection finds > 1 face |
| Looking away from screen | `looking_away` | Info | Face mesh nose-to-temple deviation > 0.09 |
| Phone detected in frame | `phone_detected` | Critical | Metadata flag from legacy callers |

### Cheating Score Calculation

Each analyzed frame produces a cheating score (0.0 to 1.0):

| Severity | Weight |
|----------|--------|
| Critical | +0.75 |
| Warning | +0.25 |
| Info | +0.10 |

Score is capped at 1.0. Example: `multiple_faces` (0.75) + `looking_away` (0.10) = 0.85.

### Frame Capture Specifications

| Parameter | Value |
|-----------|-------|
| Capture interval | Every 15 seconds |
| Resolution | 320 x 240 pixels |
| Format | JPEG |
| Quality | 60% |
| Encoding | Base64 |
| Approximate size per frame | ~8-15 KB |

### When AI Proctoring is DISABLED (`ENABLE_AI_PROCTORING=false`)

| Behavior | What Happens |
|----------|-------------|
| Webcam | **Still opens** — the webcam light turns on (deterrence effect) |
| Frame capture | Frames are still captured and sent to the API |
| Backend processing | Backend returns `{ "skipped": true }` immediately — **no call to AI service** |
| AI violations | None created |
| Server load | Minimal — no image processing |
| Student experience | Identical to enabled mode (they see the webcam is active) |

> This "deterrence mode" is intentional: even without the AI service running, students see their webcam is active and behave more honestly.

### AI Proctor Service Details

| Property | Value |
|----------|-------|
| Language | Python 3.10 - 3.13 |
| Framework | FastAPI |
| ML Library | MediaPipe (Google) |
| Image Processing | Pillow, NumPy |
| HTTP Client | httpx (for callback to API) |
| Port | 8090 |
| Health endpoint | `GET /health` → `{"status":"ok","mediapipe":"available"}` |
| Analysis endpoint | `POST /analyze-frame` |

### Installing AI Proctor Dependencies

```bash
cd services/ai-proctor
pip install -r requirements.txt
```

**requirements.txt:**
```
fastapi==0.115.6
uvicorn[standard]==0.32.1
httpx==0.28.1
mediapipe==0.10.14
Pillow==11.1.0
numpy==1.26.4
```

> **Note:** MediaPipe 0.10.14 is recommended. Version 0.10.33+ removed the `mp.solutions` API. The app.py gracefully handles this with a try/except fallback — the service still runs but skips face detection.

---

## 12. Question Randomization

Each candidate receives a **unique arrangement** of questions and MCQ options. This prevents two adjacent students from having the same question visible at the same time.

### How It Works

When a candidate clicks **Start Exam**, the backend:

1. **Shuffles question order** using the Fisher-Yates algorithm
   - All question IDs are randomly reordered
   - Stored in `questionOrder` JSON field on the session
   - Example: `["q3", "q1", "q5", "q2", "q4"]`

2. **Shuffles MCQ option positions** per question
   - For each MCQ question, the A/B/C/D positions are randomly mapped
   - Stored in `optionOrderMap` JSON field on the session
   - Example: `{ "q1": { "A": "C", "B": "A", "C": "D", "D": "B" } }`
   - This means: what was originally option A is now shown in position C, etc.

3. **Saves both maps** to the database so they persist across page reloads

### What This Means for Students

- **Student A** might see: Q3 as their first question, with options shuffled as D, B, A, C
- **Student B** might see: Q1 as their first question, with options shuffled as B, C, D, A
- Both students have the **same questions and same correct answers** — just in different order

### Answer Mapping

When a student selects option "B" on their screen, the system:
1. Looks up the option order map for that question
2. Translates the displayed position back to the original option
3. Saves the **original** option value (so grading is consistent)

Example: If the map is `{ "A": "C", "B": "A", "C": "D", "D": "B" }` and the student picks position B on screen, the system stores `"A"` (the original option that was placed at position B).

### Subjective Questions

Subjective questions are **also shuffled in order** but don't have options to shuffle.

---

## 13. Security Architecture

### Authentication

The system uses **JWT (JSON Web Tokens)** stored in **HTTP-only cookies**:

| Auth Type | Cookie Name | Lifespan | Payload |
|-----------|-------------|----------|---------|
| Admin | `admin_session` | 8 hours | `{ adminId, username }` |
| Candidate | `candidate_session` | 12 hours | `{ sessionId, candidateId }` |
| AI Proctor | (none - uses header) | — | Bearer token in `Authorization` header |

### Cookie Security Flags

| Flag | Value | Purpose |
|------|-------|---------|
| `httpOnly` | `true` | Prevents JavaScript from reading the cookie (XSS protection) |
| `sameSite` | `lax` | Prevents CSRF by blocking cross-site cookie sending |
| `secure` | `false` (dev) | Set to `true` in production with HTTPS |
| `path` | `/` | Cookie sent on all routes |

### Auth Middleware

| Middleware | Applied To | What It Does |
|-----------|-----------|-------------|
| `requireAdmin` | All `/api/admin/*` routes | Reads `admin_session` cookie, verifies JWT, attaches `adminId` to request |
| `requireCandidateSession` | `/api/responses/*`, `/api/violations` (POST) | Reads `candidate_session` cookie, verifies JWT, attaches `sessionId` to request |

### CORS Configuration

```
Origin: true (allows all origins)
Credentials: true (allows cookies)
```

> **Production note:** For production deployments, restrict `origin` to your specific server IP/domain instead of `true`.

### Input Validation

All API inputs are validated using **Zod schemas** shared between frontend and backend (`packages/shared`):

- Frontend validates before sending (provides instant feedback)
- Backend re-validates on receipt (prevents tampered requests)
- Invalid inputs return `400` with a descriptive error message

### Data Protection

| Data | Protection |
|------|-----------|
| Admin password | Stored as bcrypt hash (never plaintext) |
| JWT secret | Read from environment variable, never hardcoded |
| Correct answers | Never sent to candidate — only sent to admin endpoints |
| Session data | Scoped by JWT — candidates can only access their own session |
| Uploaded files | Stored on server filesystem, served via `/uploads/` path |

### Back-Button Protection (Post-Submit)

Three layers prevent re-entering a submitted exam:

1. **onSuccess redirect:** After submit API call succeeds, `navigate(/exam/:id/result, { replace: true })` replaces browser history
2. **Status check:** If `ExamRuntimePage` loads and session status is `submitted`/`stopped`/`expired`, immediately redirects to result page
3. **Error redirect:** If the runtime API returns an error (e.g., 409 "already submitted"), redirects to result page

---

## 14. Database Schema

### Entity Relationship Diagram

```
┌─────────┐          ┌──────────┐          ┌───────────────────┐
│  Admin   │          │   Exam   │          │ CandidateSession  │
│──────────│          │──────────│          │───────────────────│
│ id (PK)  │          │ id (PK)  │──┐       │ id (PK)           │
│ username │          │ title    │  │       │ candidateId (UQ)  │
│ passHash │          │ examCode │  │       │ examId (FK)  ◄────┤
│ display  │          │ instrHtml│  │       │ name, email, phone│
│ lastLogin│          │ status   │  │       │ ipAddress         │
└─────┬────┘          │ duration │  │       │ status            │
      │               │ totalMrks│  │       │ startedAt, endsAt │
      │               └────┬─────┘  │       │ questionOrder     │
      │                    │        │       │ optionOrderMap    │
      │               ┌────┴─────┐  │       └──┬──┬──┬──────────┘
      │               │ Question │  │          │  │  │
      │               │──────────│  │          │  │  │
      │               │ id (PK)  │  │          │  │  │
      │               │ examId FK│◄─┘          │  │  │
      │               │ type     │             │  │  │
      │               │ prompt   │     ┌───────┘  │  └────────┐
      │               │ options  │     │          │           │
      │               │ correct  │     │    ┌─────┴─────┐   ┌─┴────────┐
      │               │ marks    │     │    │ Violation  │ │ Response │
      │               └──┬───┬──┘     │    │───────────│   │──────────│
      │                  │   │        │    │ id (PK)   │   │ id (PK)  │
      │                  │   │        │    │ sessionId │   │ sessionId│
      │                  │   │        │    │ type      │   │ questionId│
      │          ┌───────┘   │        │    │ severity  │   │ selected │
      │          │           │        │    │ metadata  │   │ subjAnsw │
      │    ┌─────┴────────┐  │        │    │ detectedAt│   │ savedAt  │
      │    │SubjectiveScore│ │        │    └──────────┘    └──────────┘
      │    │──────────────│  │        │
      │    │ id (PK)      │  │        │     ┌──────────┐
      └────│ evaluatorId  │  │        │     │  Result  │
           │ sessionId ◄──┼──┼────────┘     │──────────│
           │ questionId◄──┼──┘              │ id (PK)  │
           │ awardedMarks │                 │ sessionId│
           │ remarks      │                 │ mcqScore │
           └──────────────┘                 │ subjScore│
                                            │ totalScor│
                                            │ finalized│
                                            └──────────┘
```

### Tables Detail

#### `admins`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | TEXT | Primary Key, CUID |
| `username` | VARCHAR(64) | Unique, Not Null |
| `password_hash` | TEXT | Not Null (bcrypt) |
| `display_name` | TEXT | Not Null |
| `last_login_at` | TIMESTAMPTZ | Nullable |
| `created_at` | TIMESTAMPTZ | Default: now() |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

#### `exams`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | TEXT | Primary Key, CUID |
| `title` | TEXT | Not Null |
| `exam_code` | VARCHAR(32) | Unique, Not Null |
| `instructions_html` | TEXT | Not Null |
| `status` | exam_status | Default: `draft` |
| `duration_minutes` | INTEGER | Default: 60, CHECK > 0 |
| `total_marks` | INTEGER | Not Null, CHECK > 0 |
| `scoring_mode` | scoring_mode | Default: `positive_only` |
| `results_published` | BOOLEAN | Default: false |
| `created_at` | TIMESTAMPTZ | Default: now() |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

#### `questions`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | TEXT | Primary Key, CUID |
| `exam_id` | TEXT | FK → exams(id) ON DELETE CASCADE |
| `type` | question_type | `mcq` or `subjective` |
| `prompt_html` | TEXT | Not Null |
| `option_a_html` | TEXT | Nullable (required for MCQ) |
| `option_b_html` | TEXT | Nullable (required for MCQ) |
| `option_c_html` | TEXT | Nullable (required for MCQ) |
| `option_d_html` | TEXT | Nullable (required for MCQ) |
| `correct_option` | mcq_option | Nullable (A/B/C/D for MCQ) |
| `marks` | INTEGER | Not Null, CHECK >= 0 |
| `sort_order` | INTEGER | Not Null, CHECK > 0 |
| `asset_url` | TEXT | Nullable (image URL) |
| `created_at` | TIMESTAMPTZ | Default: now() |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

**Index:** `(exam_id, sort_order)`

#### `candidate_sessions`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | TEXT | Primary Key, CUID |
| `candidate_id` | VARCHAR(32) | Unique, Not Null (e.g., `CAND-2026-001`) |
| `exam_id` | TEXT | FK → exams(id) ON DELETE CASCADE |
| `name` | TEXT | Not Null |
| `email` | TEXT | Not Null |
| `phone` | TEXT | Not Null |
| `ip_address` | TEXT | Not Null |
| `status` | session_status | Default: `registered` |
| `registered_at` | TIMESTAMPTZ | Default: now() |
| `started_at` | TIMESTAMPTZ | Nullable (set when exam starts) |
| `ends_at` | TIMESTAMPTZ | Nullable (started_at + 60 min) |
| `submitted_at` | TIMESTAMPTZ | Nullable (set when submitted) |
| `question_order` | JSONB | Nullable (shuffled question IDs) |
| `option_order_map` | JSONB | Nullable (shuffled option positions) |
| `last_heartbeat_at` | TIMESTAMPTZ | Nullable (updated every 10s) |
| `warning_count` | INTEGER | Default: 0 |
| `current_question_id` | TEXT | Nullable (from heartbeat) |
| `created_at` | TIMESTAMPTZ | Default: now() |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

**Indexes:** `(exam_id, email, phone)`, `(status, ends_at)`

#### `responses`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | TEXT | Primary Key, CUID |
| `session_id` | TEXT | FK → candidate_sessions(id) CASCADE |
| `question_id` | TEXT | FK → questions(id) CASCADE |
| `selected_option` | mcq_option | Nullable (A/B/C/D) |
| `subjective_answer_html` | TEXT | Nullable |
| `saved_at` | TIMESTAMPTZ | Default: now() |
| `final_submitted` | BOOLEAN | Default: false |
| `created_at` | TIMESTAMPTZ | Default: now() |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

**Unique constraint:** `(session_id, question_id)` — one answer per question per student

#### `violations`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | TEXT | Primary Key, CUID |
| `session_id` | TEXT | FK → candidate_sessions(id) CASCADE |
| `type` | TEXT | Not Null (e.g., `tab_switch`, `no_face`) |
| `severity` | violation_severity | `info`, `warning`, or `critical` |
| `metadata` | JSONB | Default: `{}` |
| `detected_at` | TIMESTAMPTZ | Default: now() |

**Index:** `(session_id, detected_at)`

#### `subjective_scores`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | TEXT | Primary Key, CUID |
| `session_id` | TEXT | FK → candidate_sessions(id) CASCADE |
| `question_id` | TEXT | FK → questions(id) CASCADE |
| `evaluator_admin_id` | TEXT | FK → admins(id) RESTRICT |
| `awarded_marks` | INTEGER | Not Null, CHECK >= 0 |
| `remarks` | TEXT | Nullable |
| `created_at` | TIMESTAMPTZ | Default: now() |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

**Unique constraint:** `(session_id, question_id)`

#### `results`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | TEXT | Primary Key, CUID |
| `session_id` | TEXT | FK → candidate_sessions(id) CASCADE, Unique |
| `mcq_score` | INTEGER | Default: 0 |
| `subjective_score` | INTEGER | Default: 0 |
| `total_score` | INTEGER | Default: 0 |
| `finalized_at` | TIMESTAMPTZ | Nullable (set when all grading complete) |
| `created_at` | TIMESTAMPTZ | Default: now() |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

### Enums

| Enum | Values | Used In |
|------|--------|---------|
| `exam_status` | `draft`, `scheduled`, `live`, `stopped`, `completed` | exams.status |
| `session_status` | `registered`, `in_progress`, `submitted`, `expired`, `stopped` | candidate_sessions.status |
| `question_type` | `mcq`, `subjective` | questions.type |
| `violation_severity` | `info`, `warning`, `critical` | violations.severity |
| `mcq_option` | `A`, `B`, `C`, `D` | questions.correct_option, responses.selected_option |
| `scoring_mode` | `positive_only` | exams.scoring_mode |

### Cascade Deletes

Deleting an **exam** cascades to: questions → responses, subjective_scores; candidate_sessions → responses, violations, subjective_scores, results.

Deleting a **candidate_session** cascades to: responses, violations, subjective_scores, result.

The `evaluator_admin_id` FK on subjective_scores uses **RESTRICT** — you cannot delete an admin who has graded answers.

---

## 15. API Reference

**Base URL:** `http://localhost:8080/api`

### Authentication Summary

| Type | Mechanism | How to Authenticate |
|------|-----------|-------------------|
| Admin | JWT cookie | Call `POST /api/auth/login` — cookie is set automatically |
| Candidate | JWT cookie | Call `POST /api/candidate-sessions/register` — cookie is set automatically |
| AI Proctor | Bearer token | Send `Authorization: Bearer <PROCTOR_API_TOKEN>` header |

### Error Response Format

All errors return JSON with a `message` field:

```json
{
  "message": "Description of the error"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Validation error — invalid or missing input fields |
| 401 | Authentication required or invalid token |
| 403 | Forbidden — exam not live, session mismatch, or action not allowed |
| 404 | Resource not found |
| 409 | Conflict — already submitted, duplicate entry, etc. |
| 422 | Unprocessable — invalid file format, missing required asset |
| 500 | Internal server error |

---

### 15.1 Health Check

#### `GET /api/health`

No authentication required. Use this to verify the API is running.

**Response (200):**
```json
{ "status": "ok" }
```

---

### 15.2 Admin Authentication

#### `POST /api/auth/login`

Login as admin. Sets `admin_session` HTTP-only cookie (8 hours).

**Request Body:**
```json
{
  "username": "admin",
  "password": "YourPassword123!"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `username` | string | Required, 3-64 characters |
| `password` | string | Required, 8-128 characters |

**Response (200):**
```json
{
  "admin": {
    "id": "clx1abc2d0000...",
    "username": "admin",
    "displayName": "Office Admin",
    "lastLoginAt": "2026-04-12T04:00:00.000Z"
  }
}
```

**Errors:**
- 401: Invalid username or password

---

#### `POST /api/auth/logout`

Clears the `admin_session` cookie.

**Response:** `204 No Content`

---

#### `GET /api/auth/me`

Get current admin profile. Requires `admin_session` cookie.

**Response (200):**
```json
{
  "admin": {
    "id": "clx1abc2d0000...",
    "username": "admin",
    "displayName": "Office Admin",
    "lastLoginAt": "2026-04-12T04:00:00.000Z"
  }
}
```

**Errors:**
- 401: Not authenticated (no valid cookie)

---

### 15.3 Exam Management (Admin)

All endpoints require `admin_session` cookie.

#### `GET /api/admin/exams`

List all exams.

**Response (200):**
```json
{
  "exams": [
    {
      "id": "clx1abc2d0001...",
      "title": "Physics Test",
      "examCode": "PHY-001",
      "instructionsHtml": "<p>Read each question carefully.</p>",
      "status": "draft",
      "totalMarks": 100,
      "questionCount": 10,
      "resultsPublished": false,
      "createdAt": "2026-04-12T04:00:00.000Z",
      "updatedAt": "2026-04-12T04:00:00.000Z"
    }
  ]
}
```

---

#### `POST /api/admin/exams`

Create a new exam. Duration is automatically set to 60 minutes.

**Request Body:**
```json
{
  "title": "Physics Test",
  "examCode": "PHY-001",
  "instructionsHtml": "<p>Read each question carefully. Each MCQ carries 4 marks.</p>",
  "totalMarks": 100
}
```

| Field | Type | Rules |
|-------|------|-------|
| `title` | string | Required, 3-200 characters |
| `examCode` | string | Required, 4-32 characters, auto-uppercased |
| `instructionsHtml` | string | Required, min 10 characters (HTML) |
| `totalMarks` | integer | Required, min 1 |
| `status` | string | Optional, default `"draft"` |

**Response (201):** Exam object (same format as list items)

**Errors:**
- 400: Validation error
- 409: Exam code already exists

---

#### `GET /api/admin/exams/:examId`

Get exam details with all questions (including correct answers).

**Response (200):**
```json
{
  "exam": {
    "id": "clx1abc2d0001...",
    "title": "Physics Test",
    "examCode": "PHY-001",
    "status": "draft",
    "totalMarks": 100,
    "questionCount": 2,
    "questions": [
      {
        "id": "clx1abc2d0010...",
        "type": "mcq",
        "promptHtml": "<p>What is the SI unit of force?</p>",
        "optionAHtml": "<p>Joule</p>",
        "optionBHtml": "<p>Newton</p>",
        "optionCHtml": "<p>Watt</p>",
        "optionDHtml": "<p>Pascal</p>",
        "correctOption": "B",
        "marks": 4,
        "sortOrder": 1,
        "assetUrl": null
      },
      {
        "id": "clx1abc2d0011...",
        "type": "subjective",
        "promptHtml": "<p>Explain Newton's Third Law with examples.</p>",
        "optionAHtml": null,
        "optionBHtml": null,
        "optionCHtml": null,
        "optionDHtml": null,
        "correctOption": null,
        "marks": 10,
        "sortOrder": 2,
        "assetUrl": null
      }
    ]
  }
}
```

---

#### `PUT /api/admin/exams/:examId`

Update exam fields. All fields are optional (partial update).

**Request Body:**
```json
{
  "title": "Updated Physics Test",
  "instructionsHtml": "<p>Updated instructions.</p>",
  "totalMarks": 150
}
```

**Response (200):** Updated exam object

---

#### `POST /api/admin/exams/:examId/start`

Set exam status to `live`. Students can now register and take the exam.

**Response (200):** Updated exam object with `"status": "live"`

**Errors:**
- 400: Exam has no questions
- 404: Exam not found

---

#### `POST /api/admin/exams/:examId/stop`

Set exam status to `stopped`. All active `in_progress` sessions are automatically submitted and MCQ answers are auto-graded.

**Response (200):** Updated exam object with `"status": "stopped"`

---

#### `DELETE /api/admin/exams/:examId`

Delete an exam and all associated data (questions, sessions, responses, violations, results).

**Response:** `204 No Content`

**Errors:**
- 403: Cannot delete a live exam — stop it first
- 404: Exam not found

---

### 15.4 Question Management (Admin)

All endpoints require `admin_session` cookie.

#### `POST /api/admin/exams/:examId/questions`

Add a single question to an exam.

**MCQ Request Body:**
```json
{
  "type": "mcq",
  "promptHtml": "<p>What is the SI unit of force?</p>",
  "optionAHtml": "<p>Joule</p>",
  "optionBHtml": "<p>Newton</p>",
  "optionCHtml": "<p>Watt</p>",
  "optionDHtml": "<p>Pascal</p>",
  "correctOption": "B",
  "marks": 4,
  "sortOrder": 1
}
```

**Subjective Request Body:**
```json
{
  "type": "subjective",
  "promptHtml": "<p>Explain Newton's Third Law with real-world examples.</p>",
  "marks": 10,
  "sortOrder": 2
}
```

| Field | Type | Rules |
|-------|------|-------|
| `type` | string | Required: `"mcq"` or `"subjective"` |
| `promptHtml` | string | Required, min 1 character (HTML) |
| `optionAHtml` | string | Required for MCQ |
| `optionBHtml` | string | Required for MCQ |
| `optionCHtml` | string | Required for MCQ |
| `optionDHtml` | string | Required for MCQ |
| `correctOption` | string | Required for MCQ: `"A"`, `"B"`, `"C"`, or `"D"` |
| `marks` | integer | Required, min 0 |
| `sortOrder` | integer | Required, min 1 |
| `assetUrl` | string | Optional, image URL or `/uploads/...` path |

**Response (201):** Question object

---

#### `PUT /api/admin/exams/questions/:questionId`

Update a question. Same body as creation (all fields optional).

**Response (200):** Updated question object

---

#### `DELETE /api/admin/exams/questions/:questionId`

Delete a question.

**Response:** `204 No Content`

---

#### `POST /api/admin/exams/:examId/questions/import`

Bulk import questions from an XLSX spreadsheet. **Replaces all existing questions** for the exam.

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `sheet` | File (.xlsx) | Required. Excel file with question data |
| `assets` | File (.zip) | Optional. ZIP archive with image assets |
| `examId` | string | Required. The exam ID (form field) |

**XLSX Columns:**

| Column | Required | Values |
|--------|----------|--------|
| `type` | Yes | `mcq` or `subjective` |
| `promptHtml` | Yes | Question text (HTML) |
| `optionAHtml` | MCQ only | Option A text |
| `optionBHtml` | MCQ only | Option B text |
| `optionCHtml` | MCQ only | Option C text |
| `optionDHtml` | MCQ only | Option D text |
| `correctOption` | MCQ only | `A`, `B`, `C`, or `D` |
| `marks` | Yes | Integer |
| `sortOrder` | Yes | Integer (1, 2, 3...) |
| `assetFilename` | No | Image filename from ZIP |

**Response (201):**
```json
{ "importedCount": 25 }
```

**Errors:**
- 422: Invalid XLSX format or missing required columns

---

### 15.5 Candidate Sessions

#### `POST /api/candidate-sessions/register`

Register a candidate for an exam. No authentication required (public endpoint).

If the same email + phone already has an active session for this exam, the existing session is resumed.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "examCode": "PHY-001"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | Required, 2-120 characters |
| `email` | string | Required, valid email format |
| `phone` | string | Required, 6-20 characters |
| `examCode` | string | Required, 4-32 characters, case-insensitive |

**Response (201):**
```json
{
  "session": {
    "id": "clx1abc2d0020...",
    "candidateId": "CAND-2026-001",
    "examId": "clx1abc2d0001...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "ipAddress": "192.168.1.50",
    "status": "registered",
    "registeredAt": "2026-04-12T04:00:00.000Z",
    "startedAt": null,
    "endsAt": null,
    "submittedAt": null,
    "warningCount": 0,
    "lastHeartbeatAt": null
  },
  "exam": {
    "id": "clx1abc2d0001...",
    "title": "Physics Test",
    "examCode": "PHY-001",
    "totalMarks": 100,
    "questionCount": 10
  },
  "requiresResume": false
}
```

Sets `candidate_session` HTTP-only cookie (12 hours).

**Errors:**
- 404: Exam not found (invalid exam code)
- 403: Exam is not currently live
- 409: Candidate already completed this exam (same email+phone already submitted)

---

#### `GET /api/candidate-sessions/:sessionId`

Get session and exam details. Requires `candidate_session` cookie.

**Response (200):**
```json
{
  "session": { "...session object..." },
  "exam": { "...exam summary..." }
}
```

---

#### `POST /api/candidate-sessions/:sessionId/start`

Start the exam timer. Sets `startedAt` to now and `endsAt` to now + 60 minutes. Randomizes question order and MCQ option positions.

Requires `candidate_session` cookie.

**Response (200):**
```json
{
  "session": {
    "id": "clx1abc2d0020...",
    "status": "in_progress",
    "startedAt": "2026-04-12T04:00:00.000Z",
    "endsAt": "2026-04-12T05:00:00.000Z",
    "questionOrder": ["q3", "q1", "q5", "q2", "q4"],
    "optionOrderMap": {
      "q1": { "A": "C", "B": "A", "C": "D", "D": "B" },
      "q3": { "A": "B", "B": "D", "C": "A", "D": "C" }
    }
  }
}
```

**Errors:**
- 409: Session already started or submitted

---

#### `GET /api/candidate-sessions/:sessionId/runtime`

Get live exam data: questions (in candidate's randomized order), saved responses, and time remaining.

Requires `candidate_session` cookie.

**Response (200):**
```json
{
  "session": {
    "id": "clx1abc2d0020...",
    "candidateId": "CAND-2026-001",
    "name": "John Doe",
    "status": "in_progress",
    "ipAddress": "192.168.1.50"
  },
  "exam": {
    "title": "Physics Test",
    "totalMarks": 100
  },
  "questions": [
    {
      "id": "clx1abc2d0010...",
      "type": "mcq",
      "promptHtml": "<p>What is the SI unit of force?</p>",
      "optionAHtml": "<p>Newton</p>",
      "optionBHtml": "<p>Pascal</p>",
      "optionCHtml": "<p>Joule</p>",
      "optionDHtml": "<p>Watt</p>",
      "marks": 4,
      "sortOrder": 1,
      "optionOrder": { "A": "C", "B": "A", "C": "D", "D": "B" }
    }
  ],
  "responses": [
    {
      "questionId": "clx1abc2d0010...",
      "selectedOption": "B",
      "subjectiveAnswerHtml": null,
      "savedAt": "2026-04-12T04:05:00.000Z",
      "finalSubmitted": false
    }
  ],
  "timeRemainingSeconds": 3245
}
```

> **Note:** `correctOption` is **never** included in the runtime response — students cannot see correct answers.

> **Note:** Options are shown in the candidate's shuffled order. The `optionOrder` map shows the mapping.

**Errors:**
- 409: Session not started yet, or already submitted

---

#### `POST /api/candidate-sessions/:sessionId/submit`

Submit the exam. Auto-grades all MCQ answers and creates a result record.

Requires `candidate_session` cookie.

**Response (200):**
```json
{
  "result": {
    "id": "clx1abc2d0030...",
    "sessionId": "clx1abc2d0020...",
    "mcqScore": 32,
    "subjectiveScore": 0,
    "totalScore": 32,
    "finalizedAt": null
  }
}
```

> `finalizedAt` is `null` until all subjective answers are graded by admin.

**Errors:**
- 409: Already submitted

---

#### `POST /api/candidate-sessions/:sessionId/heartbeat`

Send heartbeat signal. Called automatically by the client every 10 seconds.

Requires `candidate_session` cookie.

**Request Body:**
```json
{
  "sessionId": "clx1abc2d0020...",
  "currentQuestionId": "clx1abc2d0010..."
}
```

**Response (200):** Updated session object

**Side Effects:**
- Updates `lastHeartbeatAt` and `currentQuestionId` on the session
- If heartbeat gap > 20 seconds: creates a `heartbeat_gap` violation
- If IP address changed from registered IP: creates an `ip_change` violation

---

#### `GET /api/candidate-sessions/:sessionId/result`

Get result summary for a submitted session.

Requires `candidate_session` cookie.

**Response (200):**
```json
{
  "result": {
    "id": "clx1abc2d0030...",
    "sessionId": "clx1abc2d0020...",
    "mcqScore": 32,
    "subjectiveScore": 15,
    "totalScore": 47,
    "finalizedAt": "2026-04-12T05:30:00.000Z"
  }
}
```

---

### 15.6 Responses (Answer Save)

#### `PUT /api/responses/:sessionId`

Save or update a candidate's answer. Requires `candidate_session` cookie.

Uses upsert — creates the response if it doesn't exist, updates if it does.

**Request Body:**
```json
{
  "questionId": "clx1abc2d0010...",
  "selectedOption": "B",
  "subjectiveAnswerHtml": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `questionId` | string | Required. The question being answered |
| `selectedOption` | string or null | `"A"`, `"B"`, `"C"`, `"D"`, or `null` (for subjective or to clear) |
| `subjectiveAnswerHtml` | string or null | HTML content for subjective answers, or `null` for MCQ |

**Response (200):**
```json
{
  "response": {
    "questionId": "clx1abc2d0010...",
    "selectedOption": "B",
    "subjectiveAnswerHtml": null,
    "savedAt": "2026-04-12T04:05:00.000Z",
    "finalSubmitted": false
  }
}
```

---

### 15.7 Violations

#### `POST /api/violations`

Report a client-side violation. Requires `candidate_session` cookie.

**Request Body:**
```json
{
  "sessionId": "clx1abc2d0020...",
  "type": "tab_switch",
  "severity": "warning",
  "metadata": { "hidden": true }
}
```

| Field | Type | Rules |
|-------|------|-------|
| `sessionId` | string | Required, min 1 character |
| `type` | string | Required, 3-100 characters |
| `severity` | string | Required: `"info"`, `"warning"`, or `"critical"` |
| `metadata` | object | Optional, defaults to `{}` |

**Response (201):** Violation object

---

#### `POST /api/violations/ai`

Report a violation from the AI proctor service. Requires Bearer token.

**Headers:**
```
Authorization: Bearer <PROCTOR_API_TOKEN from .env>
```

**Request/Response:** Same format as `POST /api/violations`

---

#### `POST /api/violations/proctor-frame`

Send a webcam frame for AI analysis. Requires `candidate_session` cookie.

**Request Body:**
```json
{
  "sessionId": "clx1abc2d0020...",
  "imageBase64": "/9j/4AAQSkZJRgABAQ..."
}
```

**Response (when AI proctoring ENABLED):**
```json
{
  "created": ["violation-id-1", "violation-id-2"]
}
```

**Response (when AI proctoring DISABLED):**
```json
{
  "skipped": true
}
```

---

### 15.8 Results & Grading (Admin)

All endpoints require `admin_session` cookie.

#### `GET /api/admin/results/pending-subjective`

List all sessions that have ungraded subjective answers.

**Response (200):**
```json
{
  "pending": [
    {
      "session": {
        "id": "clx1abc2d0020...",
        "candidateId": "CAND-2026-001",
        "name": "John Doe"
      },
      "pendingResponses": [
        {
          "questionId": "clx1abc2d0011...",
          "subjectiveAnswerHtml": "<p>Newton's Third Law states that...</p>",
          "question": {
            "promptHtml": "<p>Explain Newton's Third Law with examples.</p>",
            "marks": 10
          }
        }
      ]
    }
  ]
}
```

---

#### `PUT /api/admin/results/sessions/:sessionId/questions/:questionId`

Grade a subjective answer. Awards marks and optionally adds remarks.

**Request Body:**
```json
{
  "awardedMarks": 8,
  "remarks": "Good explanation, but missing the rocket example."
}
```

| Field | Type | Rules |
|-------|------|-------|
| `awardedMarks` | integer | Required, min 0, max = question.marks |
| `remarks` | string | Optional, max 1000 characters |

**Response (200):** Updated result object

**Side Effect:** If this was the last ungraded subjective answer for the student, the result is automatically finalized (`finalizedAt` is set, `totalScore` is recalculated).

---

#### `GET /api/admin/results/sessions/:sessionId`

Get or sync a session's result. Creates the result record if it doesn't exist yet.

**Response (200):** Result object

---

#### `GET /api/admin/results/export`

Export results as a CSV file download.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `examId` | string | Optional. Filter results to a specific exam |

**Response:** CSV file download (`Content-Type: text/csv`)

---

### 15.9 Monitoring (Admin)

All endpoints require `admin_session` cookie.

#### `GET /api/admin/monitoring/sessions`

List all candidate sessions with violation counts. Returns up to 200 most recently updated sessions.

**Response (200):**
```json
{
  "sessions": [
    {
      "session": {
        "id": "clx1abc2d0020...",
        "candidateId": "CAND-2026-001",
        "name": "John Doe",
        "status": "in_progress",
        "lastHeartbeatAt": "2026-04-12T04:32:00.000Z"
      },
      "examTitle": "Physics Test",
      "activeViolations": 3,
      "latestViolation": {
        "id": "clx1abc2d0040...",
        "type": "tab_switch",
        "severity": "warning",
        "metadata": { "hidden": true },
        "detectedAt": "2026-04-12T04:15:00.000Z"
      }
    }
  ]
}
```

---

#### `GET /api/admin/monitoring/violations`

List recent violations across all sessions. Returns up to 200 most recent violations.

**Response (200):**
```json
{
  "violations": [
    {
      "id": "clx1abc2d0040...",
      "sessionId": "clx1abc2d0020...",
      "type": "blocked_shortcut",
      "severity": "warning",
      "metadata": { "key": "C", "ctrlKey": true },
      "detectedAt": "2026-04-12T04:15:00.000Z"
    }
  ]
}
```

---

#### `DELETE /api/admin/monitoring/sessions/:sessionId`

Delete a candidate session (admin override). Removes all associated data.

**Response:** `204 No Content`

---

### 15.10 Analytics (Admin)

All endpoints require `admin_session` cookie.

#### `GET /api/admin/analytics/overview`

System-wide statistics across all exams.

**Response (200):**
```json
{
  "overview": {
    "examsCount": 5,
    "activeSessions": 45,
    "submittedSessions": 120,
    "pendingSubjectiveReviews": 8,
    "violationCount": 234,
    "averageScore": 67.5
  }
}
```

---

#### `GET /api/admin/analytics/exams/:examId`

Per-exam statistics including per-question accuracy.

**Response (200):**
```json
{
  "analytics": {
    "examId": "clx1abc2d0001...",
    "title": "Physics Test",
    "status": "stopped",
    "submittedCount": 45,
    "averageScore": 72.3,
    "questionStats": [
      {
        "questionId": "clx1abc2d0010...",
        "type": "mcq",
        "sortOrder": 1,
        "attempts": 45,
        "correctCount": 38,
        "accuracy": 0.844
      }
    ]
  }
}
```

---

### 15.11 Uploads (Admin)

#### `POST /api/admin/uploads/asset`

Upload an image or file asset for use in question prompts.

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `asset` | File | The file to upload |
| `examId` | string | The exam this asset belongs to |

**Response (201):**
```json
{
  "assetUrl": "/uploads/exams/clx1abc2d0001/1712880000-diagram.png",
  "filename": "1712880000-diagram.png"
}
```

Use the returned `assetUrl` in the question's `assetUrl` field.

---

## 16. WebSocket Events (Real-Time)

The backend uses **Socket.IO** to push real-time events to connected admin dashboards.

### Connection

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:8080", {
  withCredentials: true
});

// Join the admin room
socket.emit("join:admin");
```

### Events

| Event Name | Payload | Emitted When |
|------------|---------|-------------|
| `exam.started` | `{ examId: string }` | Admin starts an exam |
| `exam.stopped` | `{ examId: string }` | Admin stops an exam |
| `session.changed` | `{ sessionId: string, status: string }` | Candidate session status changes (registered → in_progress → submitted) |
| `violation.created` | `{ sessionId: string, violationId: string }` | New anti-cheat or AI violation logged |
| `grading.updated` | `{ sessionId: string }` | Admin grades a subjective answer |
| `result.finalized` | `{ sessionId: string, resultId: string }` | All grading complete, result finalized |

### How the Admin Dashboard Uses Events

The admin dashboard subscribes to these events and:
- Refreshes the monitoring table when `session.changed` fires
- Shows a new entry in the violation feed when `violation.created` fires
- Updates the pending reviews count when `grading.updated` fires
- All updates appear instantly without page refresh

---

## 17. Docker & Production Deployment

### Docker Compose Services

The `docker-compose.yml` defines 5 services:

| Service | Image/Build | Port | Description |
|---------|-------------|------|-------------|
| `postgres` | `postgres:16-alpine` | 5432 | PostgreSQL database |
| `api` | Built from `apps/api/Dockerfile` | 8080 | Backend Express API |
| `frontend` | Built from `apps/frontend/Dockerfile` | 4173 | React frontend (Vite) |
| `nginx` | `nginx:1.27-alpine` | 80 | Reverse proxy |
| `ai-proctor` | Built from `services/ai-proctor/Dockerfile` | 8090 | AI proctoring (optional, uses `ai` profile) |

### Starting with Docker

```bash
# Without AI proctoring
docker-compose up -d

# With AI proctoring
docker-compose --profile ai up -d

# View logs
docker-compose logs -f api

# Stop everything
docker-compose down

# Stop and remove data volumes
docker-compose down -v
```

### Nginx Configuration

The Nginx reverse proxy (`infra/nginx/default.conf`) routes traffic:

| Path | Upstream | Notes |
|------|----------|-------|
| `/api/*` | `api:8080` | Backend API calls |
| `/socket.io/*` | `api:8080` | WebSocket connections (upgrade headers set) |
| `/uploads/*` | `api:8080` | Static file assets |
| `/*` (everything else) | `frontend:4173` | React SPA |

With Nginx, students access the exam at `http://<server-ip>/exam` (port 80, no port number needed).

### Production Environment Variables

In `docker-compose.yml`, update these environment variables:

```yaml
environment:
  JWT_SECRET: "generate-a-random-32-char-string"
  ADMIN_PASSWORD: "SecureProductionPassword!"
  APP_ORIGIN: "http://192.168.1.10"
  PROCTOR_API_TOKEN: "secure-proctor-token-here"
  ENABLE_AI_PROCTORING: "true"
```

### Docker Volumes

| Volume | Purpose |
|--------|---------|
| `postgres_data` | Persistent database storage (survives container restarts) |
| `uploads_data` | Uploaded question assets (images) |

---

## 18. Network / LAN Deployment

### Step-by-Step LAN Setup

#### 1. Find the Server's IP Address

```bash
# Windows
ipconfig

# Linux/Mac
ip addr show
```

Note the IPv4 address on the LAN interface (e.g., `192.168.1.10`).

#### 2. Update Environment Variables

Edit `.env`:

```env
APP_ORIGIN=http://192.168.1.10:4173
VITE_API_URL=http://192.168.1.10:8080/api
```

If using Docker with Nginx:

```env
APP_ORIGIN=http://192.168.1.10
VITE_API_URL=http://192.168.1.10/api
```

#### 3. Rebuild Frontend (Required After Changing VITE_API_URL)

```bash
npm run build:frontend
```

Or restart the dev server (it reads `.env` on startup).

#### 4. Configure Windows Firewall

Allow inbound connections on the required ports:

```powershell
# Allow port 4173 (frontend)
netsh advfirewall firewall add rule name="Exam Portal Frontend" dir=in action=allow protocol=tcp localport=4173

# Allow port 8080 (API)
netsh advfirewall firewall add rule name="Exam Portal API" dir=in action=allow protocol=tcp localport=8080

# Allow port 80 (if using Nginx)
netsh advfirewall firewall add rule name="Exam Portal Nginx" dir=in action=allow protocol=tcp localport=80
```

#### 5. Student Access

Share with students:
- **URL:** `http://192.168.1.10:4173/exam` (or `http://192.168.1.10/exam` with Nginx)
- **Exam Code:** The code you set when creating the exam (e.g., `PHY-001`)

#### 6. Recommended Network Security

| Allow | Block |
|-------|-------|
| Traffic to exam server IP (ports 80, 4173, 8080) | Internet access for student machines |
| DNS (if needed for internal resolution) | Social media, search engines |
| | USB drives and external storage |

### Binding to All Interfaces

The API server binds to `0.0.0.0` by default, meaning it accepts connections from any network interface. No additional binding configuration is needed.

### Multiple Exams Simultaneously

The system supports running multiple exams at the same time. Each exam has its own exam code, and students register with the specific code for their exam.

---

## 19. Troubleshooting

### Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `EADDRINUSE: address already in use 0.0.0.0:8080` | Port 8080 is occupied by a previous server instance | Close all previous server terminal windows, or run `taskkill /F /IM node.exe` then restart |
| `"Exam not found"` | Invalid exam code entered by student | Verify the exam code is correct (case-insensitive). Check the exam exists in admin dashboard. |
| `"This exam is not currently live"` | Exam is in `draft` or `stopped` status | Admin must click **Start Exam** in the Exam Manager |
| `"This candidate has already completed the exam attempt"` | Same email+phone combination already submitted for this exam | The student already took this exam. Cannot retake. |
| `Database connection error` / `P1001` | PostgreSQL is not running or connection string is wrong | Start PostgreSQL service. Verify `DATABASE_URL` in `.env`. |
| `node:events:496 throw er;` | Usually port conflict (EADDRINUSE) | Kill existing node processes and restart |
| `Prisma: Table does not exist` | Database schema not pushed | Run `npm run prisma:push` |
| `401 Unauthorized` on admin endpoints | Cookie expired or not set | Re-login at `/admin/login`. Cookie expires after 8 hours. |
| AI Proctor `ModuleNotFoundError` | Python dependencies not installed | Run `pip install -r requirements.txt` in `services/ai-proctor/` |
| MediaPipe `AttributeError: module 'mediapipe' has no attribute 'solutions'` | MediaPipe version >= 0.10.33 removed legacy API | The `app.py` handles this gracefully with try/except. Service runs but skips face detection. Use MediaPipe 0.10.14 for full functionality. |
| `Pillow build failure` | Pillow version doesn't have pre-built wheel for your Python version | Install latest Pillow: `pip install Pillow --upgrade` |
| Timer shows `--:--:--` | Runtime API hasn't loaded yet | Wait for the query to complete. If persistent, check API server is running. |
| Webcam not working | Browser blocking camera access | Check browser permissions. Ensure site is served over HTTP/HTTPS (not file://). |
| Back button returns to exam | Should not happen — multiple redirect layers in place | Hard refresh the result page. If issue persists, clear browser cache. |
| `CORS error` in browser console | `APP_ORIGIN` doesn't match the URL students are using | Update `APP_ORIGIN` in `.env` to match the frontend URL exactly |

### How to Reset Everything

```bash
# 1. Stop all servers (close terminal windows)

# 2. Drop and recreate the database
# In pgAdmin or psql:
DROP DATABASE exam_platform;
CREATE DATABASE exam_platform;

# 3. Re-initialize
npm run prisma:push
npm run prisma:seed

# 4. Restart servers
start.bat
```

### How to View Logs

- **API logs:** Visible in the "Exam Portal - API" terminal window
- **Frontend logs:** Visible in the "Exam Portal - Frontend" terminal window
- **AI Proctor logs:** Visible in the "Exam Portal - AI Proctor" terminal window
- **Browser console:** Open DevTools (F12) in the student's browser — but note F12 is blocked during the exam

### Checking Port Usage

```bash
# Windows: Check what's using a port
netstat -ano | findstr :8080

# Kill a specific process by PID
taskkill /F /PID <PID>

# Kill all node processes
taskkill /F /IM node.exe
```

---

## 20. FAQ

### General

**Q: Can I change the exam duration from 60 minutes?**
A: The duration is fixed at 60 minutes in the current version. The `durationMinutes` column exists in the database with a default of 60, but it is not exposed in the admin UI or API.

**Q: Can students take the exam on mobile devices?**
A: The UI is responsive and works on tablets, but fullscreen mode may not work on all mobile browsers. Desktop/laptop browsers are recommended.

**Q: Does the system require internet access?**
A: No. Everything runs on the local network. The only requirement is that students can reach the exam server's IP address.

**Q: How many students can it handle simultaneously?**
A: Tested for 100-150 concurrent students on a machine with 8 cores and 16 GB RAM. The main bottleneck is database connections and (if enabled) AI proctor frame processing.

### Admin

**Q: Can I edit questions while the exam is live?**
A: Yes, but it's not recommended. Changes apply to new sessions but may cause inconsistencies for in-progress sessions.

**Q: What happens if I stop the exam while students are still taking it?**
A: All `in_progress` sessions are automatically submitted. MCQ answers are auto-graded. Students see the "submitted" result page.

**Q: Can I restart a stopped exam?**
A: Yes, you can start it again. Previously submitted sessions remain submitted — students with the same email+phone cannot retake.

**Q: How do I add images to questions?**
A: Upload images via the Upload Asset button, which returns a URL. Paste the URL into the question's HTML or use the `assetUrl` field. For bulk import, include images in a ZIP file and reference filenames in the `assetFilename` XLSX column.

### Students

**Q: What if my browser crashes during the exam?**
A: Go back to the registration page and register again with the same email and phone number. Your session will be resumed with all saved answers and remaining time intact.

**Q: Can I go back to previous questions?**
A: Yes. Use the Question Navigator to jump to any question at any time.

**Q: What does the webcam icon/light mean?**
A: If the webcam light is on, the exam is using your camera for proctoring. This may or may not include AI analysis — the admin configures this.

**Q: What happens when time runs out?**
A: The exam is automatically submitted with all your saved answers. You'll see the result page.

### Technical

**Q: How are MCQ answers graded?**
A: Automatically on submission. The system compares the student's selected option (mapped back to the original via the option order map) against the question's `correctOption`. Full marks for correct, 0 for incorrect (positive-only scoring).

**Q: How are subjective answers graded?**
A: Manually by the admin in the Pending Reviews tab. The admin sees the question and student's answer side by side, then awards marks (0 to max).

**Q: Are answers encrypted in transit?**
A: In development mode (HTTP), no. For production, use HTTPS via Nginx with SSL certificates. The HTTP-only cookies prevent JavaScript access to session tokens regardless.

**Q: How does session resumption work?**
A: When a student registers with an email+phone that already has an `in_progress` session for the same exam, the system returns the existing session instead of creating a new one. The timer continues from where it left off (server-calculated based on `endsAt`).

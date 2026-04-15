# Chimera Fresher's Drive 2026

LAN-only computer-based test platform for office deployments. The repo is structured as a greenfield `npm` workspace with a React frontend, Express + Prisma backend, shared TypeScript contracts, and an optional Python AI proctor service.

## Workspace

- `apps/frontend`: candidate and admin single-page app built with React, Vite, Tailwind, React Query, Socket.IO client, KaTeX, and Tiptap
- `apps/api`: Express API, Prisma schema, realtime events, autosave/session logic, CSV/XLSX import, monitoring, grading, and exports
- `packages/shared`: DTO types and Zod validation contracts shared by frontend and backend
- `services/ai-proctor`: optional FastAPI scaffold for webcam-based cheating signals
- `database`: checked-in PostgreSQL schema snapshot and question import template
- `infra/nginx`: reverse proxy config for LAN deployment

## Implemented Scope

- Candidate self-registration by exam code with resume support
- Instruction screen and JEE-style runtime UI
- MCQ and typed rich-text subjective answers
- Rolling timers, autosave, reconnect/resume, and auto-submit
- Browser anti-cheat logging for fullscreen exits, tab switches, blocked shortcuts, reconnect gaps, and IP changes
- Watermark-based screenshot deterrence
- Admin exam creation, question authoring, bulk import, live monitoring, manual subjective grading, analytics, and CSV export
- Docker Compose deployment for Ubuntu with optional AI proctor service

## Quick Start

### Local Windows development

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Install PostgreSQL locally. The included bootstrap script can use the installed binaries even if the Windows service is not configured yet.
4. Run `npm run start:local`.

That script will:

- generate Prisma client
- start a local PostgreSQL cluster if the PostgreSQL binaries are installed but the service is not listening yet
- push the schema to PostgreSQL
- seed the default admin
- open separate PowerShell windows for the API and frontend

### LAN / Ubuntu deployment

1. Copy `.env.lan.example` to `.env`.
2. Install Docker and Docker Compose on the Ubuntu server.
3. Run `docker compose up --build -d`.
4. Open `http://192.168.1.10/exam` for candidates and `http://192.168.1.10/admin` for admins.

## Useful Scripts

- `npm run start:local`: bootstrap the local Windows stack and launch frontend/API
- `npm run build`: builds shared package, API, and frontend
- `npm run test`: runs the API verification script
- `npm run prisma:generate`: regenerates Prisma client
- `npm run prisma:push`: pushes the Prisma schema directly to the current database
- `npm run prisma:migrate`: runs Prisma development migrations
- `npm run prisma:seed`: creates or updates the local admin login

## Default LAN URLs

- Candidate: `http://192.168.1.10/exam`
- Admin: `http://192.168.1.10/admin`
- API health: `http://192.168.1.10/api/health`

## Admin Bootstrap

The seed script creates one local admin using:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Default values are documented in [.env.example](/c:/Users/ITSupport/Downloads/Exam%20Potal/.env.example).

## Question Import

- Spreadsheet columns are `type`, `promptHtml`, `optionAHtml`, `optionBHtml`, `optionCHtml`, `optionDHtml`, `correctOption`, `marks`, `sortOrder`, and optional `assetFilename`
- Use [database/import-template.csv](/c:/Users/ITSupport/Downloads/Exam%20Potal/database/import-template.csv) as the starter format
- Optional ZIP assets are extracted into `apps/api/uploads/exams/<examId>`

## Database and Deployment

- Prisma source schema: [apps/api/prisma/schema.prisma](/c:/Users/ITSupport/Downloads/Exam%20Potal/apps/api/prisma/schema.prisma)
- SQL snapshot: [database/schema.sql](/c:/Users/ITSupport/Downloads/Exam%20Potal/database/schema.sql)
- Compose stack: [docker-compose.yml](/c:/Users/ITSupport/Downloads/Exam%20Potal/docker-compose.yml)
- Reverse proxy: [infra/nginx/default.conf](/c:/Users/ITSupport/Downloads/Exam%20Potal/infra/nginx/default.conf)
- Local Windows bootstrap: [scripts/run-local.ps1](/c:/Users/ITSupport/Downloads/Exam%20Potal/scripts/run-local.ps1)
- Local PostgreSQL bootstrap: [scripts/start-postgres-local.ps1](/c:/Users/ITSupport/Downloads/Exam%20Potal/scripts/start-postgres-local.ps1)
- Local env template: [.env.example](/c:/Users/ITSupport/Downloads/Exam%20Potal/.env.example)
- LAN env template: [.env.lan.example](/c:/Users/ITSupport/Downloads/Exam%20Potal/.env.lan.example)

## Notes

- Phase 1 anti-cheat is browser-based and best effort only.
- Screenshot blocking is not possible in a normal browser; the platform uses watermark deterrence plus LAN/firewall controls.
- AI proctoring is optional and feeds the same `violations` pipeline instead of a separate monitoring model.

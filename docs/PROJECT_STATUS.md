# Libro-Bot — Project Status (end to end)
Last updated: 2026-11-03 19:25 IST
Current branch: librobot2.0
Last prompt completed: Phase 0 Verification & Remediation (LIBROBOT_SUPER_PROMPT.md / Master Plan)
Next prompt to run: Phase 1: Task 1 — Spring Boot Core Project Generation

## 1. Overall progress

- [x] **Phase 0: Preparation** — VERIFIED
  - [x] Create monorepo skeleton (`core-platform/`, `vision-service/`, `landing/`, `legacy/backend/`, `legacy/data/`) — VERIFIED
  - [x] Write ADRs (`docs/adr/0001-spring-boot-core-python-vision.md` and `docs/adr/0002-mysql.md`) — VERIFIED
  - [x] Read legacy `app.py` fully, produce `docs/legacy-behaviour.md` — VERIFIED
  - [x] Capture ~30 sample books and edge-case test fixtures in `samples/fixtures/audit_fixtures.json` — VERIFIED
  - [x] Remove hard-coded demo credentials (`admin123`, `admin@librobot.com`) from tracked files; `git grep` clean — VERIFIED
  - [x] Fix `Start_Libro_Bot.bat` and `setup.bat` to reference `legacy/backend/` — VERIFIED
- [ ] **Phase 1: Spring Boot core, parity without vision** — PLANNED
  - [ ] 1. Generate project (Web, Validation, Data JPA, MySQL 8, Flyway, Actuator, WebSocket) — PLANNED
  - [ ] 2. Flyway migrations for core tables (single default tenant) — PLANNED
  - [ ] 3. Inventory module: Book CRUD, bulk delete, shelf map endpoints — PLANNED
  - [ ] 4. Import/export with Apache POI: auto-matching, deduplication, backup, undo — PLANNED
  - [ ] 5. Audit module: sessions, scan-event ingestion, classification service ported from legacy — PLANNED
  - [ ] 6. Reports module: Word audit report (.docx) matching legacy structure — PLANNED
  - [ ] 7. Stats endpoint for Overview page — PLANNED
  - [ ] 8. Problem Details error handling, validation, OpenAPI docs — PLANNED
  - [ ] 9. Characterization tests matching `samples/fixtures/audit_fixtures.json` — PLANNED
- [ ] **Phase 2: Python vision service** — PLANNED
- [ ] **Phase 3: Frontend migration and integration** — PLANNED
- [ ] **Phase 4: Hardening and the "kill test"** — PLANNED *(MVP cut line)*
- [ ] **Phase 5: Circulation and vision fallbacks** — PLANNED
- [ ] **Phase 6: Authentication and roles** — PLANNED
- [ ] **Phase 7: Multi-tenancy** — PLANNED
- [ ] **Phase 8: SaaS layer** — PLANNED
- [ ] **Phase 9: Production readiness** — PLANNED

## 2. Git state

- Working branch: `librobot2.0` `f593c26`, pushed to origin: **yes**
- Protected hashes (confirmed unchanged: **yes**):
  - `main`: `d57f3f7a50f8243d1cd5c2eded2620817cf6fd4d`
  - `backup/pre-migration-20261101`: `b80f00561967e0a99430c82f53d4b7f83d410e6f`
  - tag `v2.0-flask-final`: `b0f03d18329d0ca77695f104236b74156a3e5475` (points to commit `b80f005...`)
- Phase tags created: `phase-0-complete` (initial), pending `phase-0-verified`
- Open `task/*` branches: none

## 3. System as it exists right now

The repository is structured as a **monorepo**:
- `core-platform/` — Spring Boot application skeleton (README present, implementation in Phase 1).
- `vision-service/` — FastAPI edge vision service skeleton (README present, implementation in Phase 2).
- `landing/` — SaaS marketing site skeleton (README present, implementation in Phase 8).
- `legacy/backend/` — Original Flask backend preserved read-only for behavior parity.
- `legacy/data/` — Original sample database and shelf mapping.
- `frontend/` — React 18 + Vite frontend.

### Services and ports
| Service | Tech | Port | How to start | Status |
|:---|:---|:---|:---|:---|
| Legacy Backend | Python Flask + Socket.IO + Eventlet | `5000` | `cd legacy/backend && venv\Scripts\python.exe app.py` | VERIFIED (paths updated) |
| Frontend | React 18 + Vite | `3000` | `cd frontend && npm run dev` | VERIFIED |

**One-click start:** Run `Start_Libro_Bot.bat` from repo root (launches `legacy/backend` and `frontend`).

### What a user can do today (end to end)
1. Run `Start_Libro_Bot.bat` → legacy backend and frontend start, browser opens to `http://localhost:3000/`.
2. **Home page** — animated landing page with system status indicator (VERIFIED).
3. **Login** (`/login`) — admin authentication via Firebase Auth or dev bypass (strictly requires `VITE_ENABLE_DEV_LOGIN=true` and custom credentials in `.env.local`). No plaintext credentials in client build (VERIFIED).
4. **Live Dashboard** (`/dashboard`) — start camera, select target shelf, scan barcodes in real time, classify available/missing/misplaced/safely_issued, export Word report.
5. **Overview** (`/overview`) — KPI cards, audit quality pie chart, department distribution, critical flags table.
6. **Misplaced Books** (`/misplaced`) — real-time listing of books found on wrong shelves.
7. **Admin Panel** (`/admin`) — full inventory CRUD, Excel/CSV/ODS import with auto-matching and backup, undo import, multi-format export, shelf map editor, barcode label printing.
8. **Circulation** (`/circulation`) — UI exists for checkout/return, backend endpoints missing in Flask prototype (PLANNED for Core Platform Phase 1/5).

## 4. Core platform (Spring Boot)

**Scaffolding created (`core-platform/README.md`).** Code generation scheduled as Phase 1 Task 1.

## 5. Vision service (Python)

**Scaffolding created (`vision-service/README.md`).** Scheduled for Phase 2.

## 6. Frontend

| Page | File | Backend | Status |
|:---|:---|:---|:---|
| Home | `frontend/src/pages/Home.jsx` | Legacy Flask | VERIFIED |
| Dashboard | `frontend/src/pages/Dashboard.jsx` | Legacy Flask | VERIFIED |
| Overview | `frontend/src/pages/Overview.jsx` | Legacy Flask | VERIFIED |
| Misplaced | `frontend/src/pages/MisplacedDashboard.jsx` | Legacy Flask | VERIFIED |
| Admin | `frontend/src/pages/AdminPanel.jsx` | Legacy Flask | VERIFIED |
| Circulation | `frontend/src/pages/Circulation.jsx` | Legacy Flask (endpoints missing) | PLANNED (Phase 1) |
| Login | `frontend/src/pages/Login.jsx` | Firebase Auth (dev bypass guarded, zero hardcoded secrets) | VERIFIED |

## 7. Data

- **Database:** `legacy/data/books_database_sample.xlsx` (tracked sample file)
- **Real Database:** `legacy/data/books_database.xlsx` (gitignored, local only)
- **Shelf map:** `legacy/data/shelf_map.json` (12 departments mapped to shelf codes A1–J1)
- **Test fixtures:** `samples/fixtures/audit_fixtures.json` (30 books catalog, 5 comprehensive edge-case scenarios) — VERIFIED

## 8. Tests and quality

- Automated test suites: None in legacy Flask.
- Characterization test fixtures: 5 scenarios covering single-shelf, misplaced from other shelf, uncataloged barcode, duplicate scan deduplication, and whole-library audit without target shelf in `samples/fixtures/audit_fixtures.json` — VERIFIED.
- Core platform tests: Scheduled for Phase 1.

## 9. Resilience scenarios

| Scenario | Implemented | Tested | Result |
|:---|:---|:---|:---|
| Vision service down | PLANNED (Phase 4) | — | — |
| Camera disconnected | Partial (backoff reconnect in Flask) | NOT TESTED | — |
| Core down | PLANNED (Phase 4) | — | — |
| Core slow | PLANNED (Phase 4) | — | — |
| Duplicate event delivery | PLANNED (Phase 4) | — | — |
| Database down | N/A (Excel, no DB server) | — | — |
| Bad Excel import | Backup snapshot created before import | VERIFIED (code inspection) | Passes |

## 10. Security checklist

| Item | Status | Notes |
|:---|:---|:---|
| No secrets in tracked files | VERIFIED | `.env.local` gitignored; `.env.example` committed with template placeholders; real Excel databases gitignored; `git grep -i "admin123"` returns 0 results |
| Passwords hashed | N/A (Firebase Auth handles this) | Will use BCrypt in Phase 6 |
| Demo credentials in code | VERIFIED | Hardcoded `admin123` and `admin@librobot.com` completely eliminated from tracked code |
| CORS restricted | PLANNED (Phase 1) | Legacy had open CORS; Spring Boot core will restrict origins |
| Inputs validated | PLANNED (Phase 1) | Spring Boot Bean Validation |
| File uploads limited | PLANNED (Phase 1) | Size limits on multipart upload |
| Tenant isolation | PLANNED (Phase 7) | `tenant_id` on all business entities |
| Rate limiting | PLANNED (Phase 6) | Spring Security / Bucket4j |

## 11. Known issues, shortcuts and risks

1. **Circulation endpoints** (`/api/books/checkout`, `/api/books/return`) referenced by frontend do not exist in legacy backend. Will be implemented in Core platform.
2. **Excel file locking** in legacy backend (`PermissionError`). Will be solved by MySQL database in Phase 1.
3. Firebase web API key present in git history (`frontend/src/firebase.js`, commit `236732f`, removed in `ead4c29`). Action for Nishanth: restrict key in Google Cloud Console.

## 12. Decisions (ADRs)

1. `docs/adr/0001-spring-boot-core-python-vision.md` — Decoupled Spring Boot Core Platform (Domain Logic, MySQL, Persistence) and Python Vision Service (Hardware, FrameSource, PyZbar).
2. `docs/adr/0002-mysql.md` — Relational persistence with MySQL 8.x and Flyway schema migrations.

## 13. Open questions for Nishanth & Resolutions

1. **"No target shelf" rule resolution (Prompt 0.2 finding):**
   - In legacy `build_status()`, when `target_shelf is None`:
     - Every scanned cataloged book is classified as **`available`** (no shelf mismatch check is executed).
     - Every unscanned cataloged book is classified as **`safely_issued`** (if status is Issued) or **`missing`** (if status is Available).
     - Only scanned barcodes NOT found in the catalog are classified as **`misplaced`** (with `found_on_shelf: "Unknown"`).
     - **Decision for Phase 1 Core:** Core will maintain dual-mode audit sessions:
       - Mode A (Default): Shelf Audit (`target_shelf` set). Misplacement detected when `book.shelf != target_shelf`.
       - Mode B: Free-Form / Whole Library (`target_shelf` is null). Follows legacy parity where all scanned cataloged books are available, unscanned are missing/issued, and uncataloged are misplaced.
2. Should an audit session be per shelf, per department, or free-form? -> Default to per-shelf, with optional whole-library mode.
3. Is the first customer the SREC library only, or a few libraries from the start?
4. In-house auth (Spring Security + JWT) or Keycloak? (Decide at Phase 6 start).
5. Where will the cloud core be hosted for the pilot?
6. Which member identifier does circulation use (student ID, email, both)? (Default: student ID / barcode).

## 14. Verification log

| Date | Command run | Result summary |
|:---|:---|:---|
| 2026-11-01 | `git fetch origin` | Clean fetch |
| 2026-11-01 | `git rev-parse origin/main origin/backup/... v2.0-flask-final HEAD` | All hashes recorded and verified |
| 2026-11-01 | Monorepo restructuring commit | Moved Flask app to `legacy/`, updated `.gitignore` |
| 2026-11-03 | `git grep -n -i "admin123"` | Clean: 0 hits across all tracked files |
| 2026-11-03 | `git ls-files \| Select-String "xlsx\|\.env"` | Clean: only `.env.example` and sample data tracked |
| 2026-11-03 | `Get-ChildItem core-platform, vision-service, landing, docs\adr` | All 4 directories verified |
| 2026-11-03 | `Get-ChildItem samples\fixtures` | Verified: 30-book fixture with 5 scenarios |
| 2026-11-03 | `Start_Libro_Bot.bat` path update | Updated backend startup path to `legacy\backend` |

## Changelog (newest first)

- 2026-11-03 | Phase 0: Verification & Remediation | Created `core-platform/`, `vision-service/`, `landing/` scaffolding. Authored `docs/adr/0002-mysql.md`. Removed `admin123` and hardcoded credentials completely (`git grep` clean). Created ~30 book fixtures and 5 edge-case scenarios in `samples/fixtures/audit_fixtures.json`. Fixed `Start_Libro_Bot.bat` and `setup.bat` legacy paths. Resolved and documented the "no target shelf" classification rule. Updated `docs/PROJECT_STATUS.md` with strict verification labels.
- 2026-11-01 | Phase 0: Preparation | Monorepo structure initialized with `legacy/`. ADR 0001 created. Full legacy behavior specification produced in `docs/legacy-behaviour.md`.
- 2026-11-01 | First-Run Procedure | Created frozen backup branch `backup/pre-migration-20261101` and tag `v2.0-flask-final`. Updated `.gitignore`. Created `docs/PROJECT_STATUS.md`. Commits: `b80f005`, `fe5c017`, `0c3a7d4`.

# Libro-Bot — Project Status (end to end)
Last updated: 2026-11-01 22:55 IST
Current branch: librobot2.0
Last prompt completed: Phase 0: Preparation & Legacy Behaviour Documentation (LIBROBOT_MASTER_PLAN.md Section 16 / Prompt 0.1)
Next prompt to run: Phase 1: Task 1 — Spring Boot Core Project Generation

## 1. Overall progress

- [x] **Phase 0: Preparation** — DONE
  - [x] Create monorepo structure, move Flask code to `legacy/`
  - [x] Write `docs/adr/0001-spring-boot-core-python-vision.md`
  - [x] Read legacy `app.py` fully, produce `docs/legacy-behaviour.md`
  - [x] Capture sample data and test fixtures (`docs/fixtures/audit_fixtures.json`)
  - [x] Remove hard-coded demo admin credentials from public files (`Login.jsx`, `.env.example`)
- [ ] **Phase 1: Spring Boot core, parity without vision** — NOT STARTED
  - [ ] 1. Generate project (Web, Validation, Data JPA, MySQL 8, Flyway, Actuator, Security, WebSocket)
  - [ ] 2. Flyway migrations for core tables (single default tenant)
  - [ ] 3. Inventory module: Book CRUD, bulk delete, shelf map endpoints
  - [ ] 4. Import/export with Apache POI: auto-matching, deduplication, backup, undo
  - [ ] 5. Audit module: sessions, scan-event ingestion, classification service ported from legacy
  - [ ] 6. Reports module: Word audit report (.docx) matching legacy structure
  - [ ] 7. Stats endpoint for Overview page
  - [ ] 8. Problem Details error handling, validation, OpenAPI docs
  - [ ] 9. Characterization tests for classification matching `docs/fixtures/audit_fixtures.json`
- [ ] **Phase 2: Python vision service** — NOT STARTED
- [ ] **Phase 3: Frontend migration and integration** — NOT STARTED
- [ ] **Phase 4: Hardening and the "kill test"** — NOT STARTED *(MVP cut line)*
- [ ] **Phase 5: Circulation and vision fallbacks** — NOT STARTED
- [ ] **Phase 6: Authentication and roles** — NOT STARTED
- [ ] **Phase 7: Multi-tenancy** — NOT STARTED
- [ ] **Phase 8: SaaS layer** — NOT STARTED
- [ ] **Phase 9: Production readiness** — NOT STARTED

## 2. Git state

- Working branch: `librobot2.0` `6492bc1`, pushed to origin: **yes**
- Protected hashes (confirmed unchanged: **yes**):
  - `main`: `d57f3f7a50f8243d1cd5c2eded2620817cf6fd4d`
  - `backup/pre-migration-20261101`: `b80f00561967e0a99430c82f53d4b7f83d410e6f`
  - tag `v2.0-flask-final`: `b0f03d18329d0ca77695f104236b74156a3e5475` (points to commit `b80f005...`)
- Phase tags created: `phase-0-complete` (points to `6492bc1`)
- Open `task/*` branches: none

## 3. System as it exists right now

The repository is now structured as a **monorepo**:
- Legacy Flask code has been moved to `legacy/backend/` and `legacy/data/` for behavior parity and reference.
- Frontend remains in `frontend/`.
- `core-platform/` (Spring Boot) and `vision-service/` (FastAPI) will be generated in Phases 1 and 2.

### Services and ports
| Service | Tech | Port | How to start |
|:---|:---|:---|:---|
| Legacy Backend | Python Flask + Socket.IO + Eventlet | `5000` | `cd legacy/backend && venv\Scripts\python.exe app.py` |
| Frontend | React 18 + Vite | `3000` | `cd frontend && npm run dev` |

### What a user can do today (end to end)
1. Run legacy backend from `legacy/backend/` and frontend from `frontend/`.
2. **Home page** — animated landing page with system status indicator.
3. **Login** (`/login`) — admin authentication via Firebase Auth or dev bypass (requires `VITE_ENABLE_DEV_LOGIN=true` in `.env.local`).
4. **Live Dashboard** (`/dashboard`) — start camera, select target shelf, scan barcodes in real time, see books classified as available/missing/misplaced/safely_issued, export Word report.
5. **Overview** (`/overview`) — KPI cards, audit quality pie chart, department distribution, critical flags table.
6. **Misplaced Books** (`/misplaced`) — real-time listing of books found on wrong shelves.
7. **Admin Panel** (`/admin`) — full inventory CRUD, Excel/CSV/ODS import with auto-matching and backup, undo import, multi-format export, shelf map editor, barcode label printing.
8. **Circulation** (`/circulation`) — UI exists for checkout/return, backend endpoints planned for Phase 1/5.

## 4. Core platform (Spring Boot)

**Not created yet.** Generation is scheduled as Phase 1 Task 1.

## 5. Vision service (Python)

**Not created as a separate service yet.** Scheduled for Phase 2.

## 6. Frontend

| Page | File | Backend | Status |
|:---|:---|:---|:---|
| Home | `frontend/src/pages/Home.jsx` | Legacy Flask | VERIFIED |
| Dashboard | `frontend/src/pages/Dashboard.jsx` | Legacy Flask | VERIFIED |
| Overview | `frontend/src/pages/Overview.jsx` | Legacy Flask | VERIFIED |
| Misplaced | `frontend/src/pages/MisplacedDashboard.jsx` | Legacy Flask | VERIFIED |
| Admin | `frontend/src/pages/AdminPanel.jsx` | Legacy Flask | VERIFIED |
| Circulation | `frontend/src/pages/Circulation.jsx` | Legacy Flask (endpoints missing) | PLANNED (Phase 1) |
| Login | `frontend/src/pages/Login.jsx` | Firebase Auth (dev bypass guarded) | VERIFIED |

## 7. Data

- **Database:** `legacy/data/books_database_sample.xlsx` (tracked sample file)
- **Real Database:** `legacy/data/books_database.xlsx` (gitignored, local only)
- **Shelf map:** `legacy/data/shelf_map.json` (12 departments mapped to shelf codes A1–J1)
- **Test fixtures:** `docs/fixtures/audit_fixtures.json` (3 characterization test scenarios captured)

## 8. Tests and quality

- Automated test suites: None in legacy system. Characterization test suite designed in `docs/fixtures/audit_fixtures.json`.
- Core platform tests: Scheduled for Phase 1.

## 9. Resilience scenarios

| Scenario | Implemented | Tested | Result |
|:---|:---|:---|:---|
| Vision service down | PLANNED (Phase 4) | — | — |
| Camera disconnected | Partial (backoff reconnect in Flask) | Not tested | — |
| Core down | PLANNED (Phase 4) | — | — |
| Core slow | PLANNED (Phase 4) | — | — |
| Duplicate event delivery | PLANNED (Phase 4) | — | — |
| Database down | N/A (Excel, no DB server) | — | — |
| Bad Excel import | Backup snapshot created before import | VERIFIED (legacy code inspection) | Passes |

## 10. Security checklist

| Item | Status | Notes |
|:---|:---|:---|
| No secrets in tracked files | VERIFIED | `.env.local` gitignored; `.env.example` committed with template placeholders; real Excel databases gitignored |
| Passwords hashed | N/A (Firebase Auth handles this) | Will use BCrypt in Phase 6 |
| Demo credentials in code | VERIFIED | Plaintext bypass removed; guarded behind `VITE_ENABLE_DEV_LOGIN === 'true'` |
| CORS restricted | PLANNED (Phase 1) | Legacy had open CORS; Spring Boot core will restrict origins |
| Inputs validated | PLANNED (Phase 1) | Spring Boot Bean Validation |
| File uploads limited | PLANNED (Phase 1) | Size limits on multipart upload |
| Tenant isolation | PLANNED (Phase 7) | `tenant_id` on all business entities |
| Rate limiting | PLANNED (Phase 6) | Spring Security / Bucket4j |

## 11. Known issues, shortcuts and risks

1. **Circulation endpoints** (`/api/books/checkout`, `/api/books/return`) referenced by frontend do not exist in legacy backend. Will be implemented in Core platform.
2. **Excel file locking** in legacy backend (`PermissionError`). Will be solved by MySQL database in Phase 1.
3. Firebase web API key present in git history (frontend/src/firebase.js, commit 236732f, removed in ead4c29). Action for Nishanth: restrict key in Google Cloud Console.

## 12. Decisions (ADRs)

1. `docs/adr/0001-spring-boot-core-python-vision.md` — Decoupled Spring Boot Core Platform (Domain Logic, MySQL, Persistence) and Python Vision Service (Hardware, FrameSource, PyZbar).

## 13. Open questions for Nishanth

1. **Answered:** Classification in legacy `build_status()` when no target shelf is selected: Scanned books are `available`, unscanned are `safely_issued` or `missing`, and unknown scanned barcodes are marked `misplaced` with `found_on_shelf: "Unknown"`.
2. Should an audit session be per shelf, per department, or free-form? (Recommended default: per-shelf by default, with an optional "Whole Library / All Shelves" mode).
3. Is the first customer the SREC library only, or a few libraries from the start?
4. In-house auth (Spring Security + JWT) or Keycloak? (Decide at Phase 6 start).
5. Where will the cloud core be hosted for the pilot?
6. Which member identifier does circulation use (student ID, email, both)? (Recommended default: student ID / barcode).

## 14. Verification log

| Date | Command run | Result summary |
|:---|:---|:---|
| 2026-11-01 | `git fetch origin` | Clean fetch |
| 2026-11-01 | `git rev-parse origin/main origin/backup/... v2.0-flask-final HEAD` | All hashes recorded and verified |
| 2026-11-01 | `git commit` (monorepo restructuring) | Moved Flask app to `legacy/`, updated `.gitignore` |
| 2026-11-01 | PowerShell zip inspection of `books_database_sample.xlsx` | 5 sample books extracted and verified |
| 2026-11-01 | Inspection of `legacy/backend/app.py` | Complete behavioral specification documented |
| 2026-11-01 | Update `Login.jsx` & `.env.example` | Demo credentials safely decoupled behind `VITE_ENABLE_DEV_LOGIN` |

## Changelog (newest first)

- 2026-11-01 | Phase 0: Preparation | Monorepo structure finalized with `legacy/`. ADR 0001 created. Full legacy behavior specification produced in `docs/legacy-behaviour.md`. Characterization fixtures created in `docs/fixtures/audit_fixtures.json`. Demo credentials in `Login.jsx` moved behind dev environment flag. Updated `docs/PROJECT_STATUS.md`.
- 2026-11-01 | First-Run Procedure | Created frozen backup branch `backup/pre-migration-20261101` and tag `v2.0-flask-final`. Updated `.gitignore`. Created `docs/PROJECT_STATUS.md`. Commits: `b80f005`, `fe5c017`, `0c3a7d4`.

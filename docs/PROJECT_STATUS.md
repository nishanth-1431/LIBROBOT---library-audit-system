# Libro-Bot — Project Status (end to end)
Last updated: 2026-11-01 10:25 IST
Current branch: librobot2.0
Last prompt completed: First-Run Procedure (LIBROBOT_SUPER_PROMPT.md Section 4.2)
Next prompt to run: Prompt 0.1 (Phase 0 — legacy behaviour documentation)

## 1. Overall progress

- [ ] **Phase 0: Preparation** — NOT STARTED
  - [ ] Create monorepo structure, move Flask code to `legacy/`
  - [ ] Write `docs/adr/0001-spring-boot-core-python-vision.md`
  - [ ] Read legacy `app.py` fully, produce `docs/legacy-behaviour.md`
  - [ ] Capture sample data and test fixtures
  - [ ] Remove hard-coded demo admin credentials from public files
- [ ] **Phase 1: Spring Boot core, parity without vision** — NOT STARTED
- [ ] **Phase 2: Python vision service** — NOT STARTED
- [ ] **Phase 3: Frontend migration and integration** — NOT STARTED
- [ ] **Phase 4: Hardening and the "kill test"** — NOT STARTED *(MVP cut line)*
- [ ] **Phase 5: Circulation and vision fallbacks** — NOT STARTED
- [ ] **Phase 6: Authentication and roles** — NOT STARTED
- [ ] **Phase 7: Multi-tenancy** — NOT STARTED
- [ ] **Phase 8: SaaS layer** — NOT STARTED
- [ ] **Phase 9: Production readiness** — NOT STARTED

## 2. Git state

- Working branch: `librobot2.0` `b80f005`, pushed to origin: **yes**
- Protected hashes (confirmed unchanged: **yes**):
  - `main`: `d57f3f7a50f8243d1cd5c2eded2620817cf6fd4d`
  - `backup/pre-migration-20261101`: `b80f00561967e0a99430c82f53d4b7f83d410e6f`
  - tag `v2.0-flask-final`: `b0f03d18329d0ca77695f104236b74156a3e5475` (points to commit `b80f005...`)
- Phase tags created: none yet
- Open `task/*` branches: none

## 3. System as it exists right now

The project is the **original Flask-based prototype** (Libro-Bot 2.0). No Spring Boot code exists yet.

### Services and ports
| Service | Tech | Port | How to start |
|:---|:---|:---|:---|
| Backend | Python Flask + Socket.IO + Eventlet | `5000` | `cd backend && venv\Scripts\python.exe app.py` |
| Frontend | React 18 + Vite | `3000` | `cd frontend && npm run dev` |

**One-click start:** Run `Start_Libro_Bot.bat` from the repo root.

### What a user can do today (end to end)
1. Run `Start_Libro_Bot.bat` → backend and frontend start, browser opens to `http://localhost:3000/`.
2. **Home page** — animated landing page with system status indicator.
3. **Login** (`/login`) — admin authentication via Firebase Auth or demo bypass (`admin@librobot.com` / `admin123`).
4. **Live Dashboard** (`/dashboard`) — start camera, select target shelf, scan barcodes in real time, see books classified as available/missing/misplaced/safely_issued, export Word report.
5. **Overview** (`/overview`) — KPI cards, audit quality pie chart, department distribution, critical flags table.
6. **Misplaced Books** (`/misplaced`) — real-time listing of books found on wrong shelves, with shelf comparison.
7. **Admin Panel** (`/admin`) — full inventory CRUD, Excel/CSV/ODS import with auto-matching and backup, undo import, multi-format export, shelf map editor, barcode label printing.
8. **Circulation** (`/circulation`) — UI exists for checkout/return with camera scanning, but **backend endpoints do not exist** (calling `/api/books/checkout` and `/api/books/return` will 404).

## 4. Core platform (Spring Boot)

**Does not exist yet.** All backend logic is in `backend/app.py` (Flask). This is the primary deliverable of Phases 1–4.

## 5. Vision service (Python)

**Does not exist as a separate service.** Camera control, barcode decoding, and frame streaming are embedded in `backend/app.py`. These will be extracted into a standalone FastAPI service in Phase 2.

## 6. Frontend

All pages currently talk to the **legacy Flask backend** at `http://127.0.0.1:5000`:

| Page | File | Backend |
|:---|:---|:---|
| Home | `frontend/src/pages/Home.jsx` | Flask (Socket.IO for status dot) |
| Dashboard | `frontend/src/pages/Dashboard.jsx` | Flask (REST + Socket.IO + MJPEG `/video_feed`) |
| Overview | `frontend/src/pages/Overview.jsx` | Flask (REST) |
| Misplaced | `frontend/src/pages/MisplacedDashboard.jsx` | Flask (REST + Socket.IO) |
| Admin | `frontend/src/pages/AdminPanel.jsx` | Flask (REST) |
| Circulation | `frontend/src/pages/Circulation.jsx` | Flask (REST + Socket.IO) — **endpoints missing** |
| Login | `frontend/src/pages/Login.jsx` | Firebase Auth + mock bypass |

## 7. Data

- **Database:** `data/books_database.xlsx` (Excel file, loaded into memory by Pandas at startup)
- **Shelf map:** `data/shelf_map.json` (12 departments mapped to shelf codes A1–J1)
- **Schema:** `['Barcode', 'Book Name', 'Author', 'Department', 'Status', 'Shelf']`
- **No MySQL.** MySQL will be introduced in Phase 1.
- **No tenants.** Multi-tenancy is Phase 7.

## 8. Tests and quality

- **No automated tests exist** for the backend or frontend.
- Coverage: not measured.
- Performance: not measured.

## 9. Resilience scenarios

| Scenario | Implemented | Tested | Result |
|:---|:---|:---|:---|
| Vision service down | PLANNED (Phase 4) | — | — |
| Camera disconnected | Partial (backoff reconnect in Flask) | Not tested | — |
| Core down | PLANNED (Phase 4) | — | — |
| Core slow | PLANNED (Phase 4) | — | — |
| Duplicate event delivery | PLANNED (Phase 4) | — | — |
| Database down | N/A (Excel, no DB server) | — | — |
| Bad Excel import | Backup snapshot created before import | Not formally tested | — |

## 10. Security checklist

| Item | Status |
|:---|:---|
| No secrets in tracked files | ⚠️ Firebase keys were in old history; `.env.local` is now gitignored; `firebase.js` reads from env vars |
| Passwords hashed | N/A (Firebase Auth handles this) |
| Demo credentials in code | ⚠️ `admin@librobot.com` / `admin123` plaintext in `Login.jsx` — must be moved behind a dev flag |
| CORS restricted | Partial (`CORS(app)` with no origin restrictions) |
| Inputs validated | Partial (some checks in Flask routes) |
| File uploads limited | Partial (extension check only, no size limit) |
| Tenant isolation | NOT STARTED (Phase 7) |
| Rate limiting | NOT IMPLEMENTED |

## 11. Known issues, shortcuts and risks

1. **Demo admin credentials** (`admin@librobot.com` / `admin123`) are hardcoded in `Login.jsx` line 23. Must be moved behind a dev-only flag before production.
2. **Circulation endpoints** (`/api/books/checkout`, `/api/books/return`) referenced by the frontend do not exist in the backend. Calling them will 404.
3. **Excel file locking** — if `books_database.xlsx` is open in MS Office, the backend returns `PermissionError`.
4. **No automated tests** anywhere in the project.
5. **CORS is fully open** (`CORS(app)` with `cors_allowed_origins="*"`).
6. **No HTTPS** — everything runs on plain HTTP locally.
7. Firebase web API key present in git history (frontend/src/firebase.js, commit 236732f, removed in ead4c29). No private key found. Action for Nishanth: restrict key, review Firebase rules, delete demo user. Do not rewrite history.

## 12. Decisions (ADRs)

None recorded yet. First ADR (`0001-spring-boot-core-python-vision.md`) will be created in Phase 0.

## 13. Open questions for Nishanth

1. Exactly which classifications exist in legacy `build_status()`, and how is "misplaced" decided when no target shelf is selected? *(Will be answered by reading the code in Phase 0)*
2. Should an audit session be per shelf, per department, or free-form?
3. Is the first customer the SREC library only, or a few libraries from the start?
4. In-house auth (Spring Security + JWT) or Keycloak? *(Decide at Phase 6 start)*
5. Where will the cloud core be hosted for the pilot?
6. Which member identifier does circulation use (student ID, email, both)?

## 14. Verification log

| Date | Command run | Result summary |
|:---|:---|:---|
| 2026-11-01 | `git fetch origin` | Clean fetch, no new changes |
| 2026-11-01 | `git status -sb` | On `librobot2.0`, 4 untracked files (plan docs + msme) |
| 2026-11-01 | `git branch -a` | `main`, `librobot2.0` local + remote |
| 2026-11-01 | `git stash list` | No stashes |
| 2026-11-01 | `git rev-parse origin/main origin/backup/... v2.0-flask-final HEAD` | All hashes recorded in Section 2 |
| 2026-11-01 | `git push origin librobot2.0` | `d57f3f7..b80f005` pushed |
| 2026-11-01 | `git push -u origin backup/pre-migration-20261101` | New branch created on remote |
| 2026-11-01 | `git push origin v2.0-flask-final` | New tag created on remote |

## Changelog (newest first)

- 2026-11-01 | First-Run Procedure | Created frozen backup branch `backup/pre-migration-20261101` and tag `v2.0-flask-final`. Updated `.gitignore`. Created `docs/PROJECT_STATUS.md`. | Commits: `b80f005` (working state save), pending (this file)

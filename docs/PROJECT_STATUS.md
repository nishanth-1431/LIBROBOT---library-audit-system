# Libro-Bot — Project Status (end to end)
Last updated: 2026-11-08 23:05 IST
Current branch: librobot2.0
Last prompt completed: Prompt 1.1 Corrections — Spring Boot 4.x Migration & Monorepo Scaffolding (Java 17, Spring Boot 4.0.0)
Next prompt to run: Prompt 1.2 — Flyway Migrations for Core Tables

## 1. Overall progress

- [x] **Phase 0: Preparation** — VERIFIED
  - [x] Create monorepo skeleton (`core-platform/`, `vision-service/`, `landing/`, `legacy/backend/`, `legacy/data/`) — VERIFIED
  - [x] Write ADRs (`docs/adr/0001-spring-boot-core-python-vision.md` and `docs/adr/0002-mysql.md`) — VERIFIED
  - [x] Read legacy `app.py` fully, produce `docs/legacy-behaviour.md` — VERIFIED
  - [x] Capture ~30 sample books and edge-case test fixtures in `samples/fixtures/audit_fixtures.json` — VERIFIED
  - [x] Remove hard-coded demo credentials from tracked files; `git grep` clean — VERIFIED
  - [x] Fix `Start_Libro_Bot.bat` and `setup.bat` to reference `legacy/backend/` — VERIFIED
- [ ] **Phase 1: Spring Boot core, parity without vision** — IN PROGRESS
  - [x] 1. Generate project (WebMVC, Validation, Data JPA, MySQL 8, Flyway, Actuator, OpenAPI) — IMPLEMENTED BUT RUNTIME VERIFICATION NOT VERIFIED (Docker daemon stopped)
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

- Working branch: `librobot2.0`, pushed to origin: **yes**
- Protected hashes:
  - `backup/pre-migration-20261101`: `b80f00561967e0a99430c82f53d4b7f83d410e6f` (confirmed unchanged: **yes**)
  - tag `v2.0-flask-final`: `b0f03d18329d0ca77695f104236b74156a3e5475` (confirmed unchanged: **yes**)
  - `origin/main`: `27e69830a645da9d5d56ea8d4951f0653c36ca5e` (confirmed unchanged: **yes**)
- Phase tags created: `phase-0-complete`, `phase-0-verified`
- Open `task/*` branches: none

## 3. System as it exists right now

The repository is structured as a **monorepo**:
- `core-platform/` — Spring Boot 4.0.0 application (Java 17 baseline matching installed JDK `17.0.17`, Maven wrapper `mvnw`, baseline Flyway migration).
- `vision-service/` — FastAPI edge vision service skeleton (README present, implementation in Phase 2).
- `landing/` — SaaS marketing site skeleton (README present, implementation in Phase 8).
- `legacy/backend/` — Original Flask backend preserved read-only for behavior parity.
- `legacy/data/` — Original sample database and shelf mapping.
- `frontend/` — React 18 + Vite frontend.
- `docker-compose.yml` — Root orchestration for `mysql:8.0` with healthcheck and named volume.

### Services and ports
| Service | Tech | Port | How to start | Status |
|:---|:---|:---|:---|:---|
| Core Platform | Spring Boot 4.0.0 + Java 17 | `8080` | `cd core-platform && .\mvnw.cmd spring-boot:run` | NOT VERIFIED (blocked on MySQL) |
| Database | MySQL 8.0 (Docker) | `3306` | `docker compose up -d` | NOT VERIFIED (Docker Desktop stopped) |
| Legacy Backend | Python Flask + Socket.IO + Eventlet | `5000` | `cd legacy/backend && venv\Scripts\python.exe app.py` | VERIFIED |
| Frontend | React 18 + Vite | `3000` | `cd frontend && npm run dev` | VERIFIED |

## 4. Core platform (Spring Boot)

- **Framework:** Spring Boot 4.0.0 (Spring Framework 7, Jakarta EE 11)
- **Language Target:** Java 17 LTS (aligned with installed OpenJDK 17.0.17)
- **Build Tool:** Apache Maven with committed Maven wrapper (`mvnw`, `mvnw.cmd`, `.mvn/`)
- **Modules (`com.librobot` with `package-info.java`):**
  - `common`: Shared exceptions, Problem Details handlers, global DTOs
  - `inventory`: Book CRUD, shelf mappings, Excel/CSV sync
  - `audit`: Sessions, scan ingestion, classification engine
  - `reports`: Word and Excel report generation
  - `circulation`: Book issue and return tracking
  - `iam`: Tenants, users, authentication
  - `billing`: SaaS plans and payment webhooks
  - `realtime`: WebSocket STOMP messaging
- **Database & Persistence:**
  - `spring.jpa.open-in-view: false`
  - `spring.jpa.hibernate.ddl-auto: validate`
  - Baseline migration: `V1__baseline.sql` (`tenants` table with default tenant seed)
- **Profiles:** `dev` and `test` in `application.yml` using environment variables.

## 5. Vision service (Python)

Scaffolding created (`vision-service/README.md`). Scheduled for Phase 2.

## 6. Frontend

All pages currently talk to legacy Flask backend at `http://127.0.0.1:5000`. Frontend migration to Spring Boot occurs in Phase 3.

## 7. Data

- **Database:** MySQL 8.0 schema managed via Flyway (`V1__baseline.sql`)
- **Reference Catalog:** `samples/fixtures/audit_fixtures.json` (30 books catalog, 5 scenarios)
- **Legacy Sample:** `legacy/data/books_database_sample.xlsx`

## 8. Tests and quality

- Characterization fixtures: 5 scenarios in `samples/fixtures/audit_fixtures.json` — VERIFIED.
- Core platform tests: Planned for Phase 1.

## 9. Resilience scenarios

| Scenario | Implemented | Tested | Result |
|:---|:---|:---|:---|
| Vision service down | PLANNED (Phase 4) | — | — |
| Camera disconnected | Partial (backoff in Flask) | NOT TESTED | — |
| Core down | PLANNED (Phase 4) | — | — |
| Core slow | PLANNED (Phase 4) | — | — |
| Duplicate event delivery | PLANNED (Phase 4) | — | — |
| Database down | PLANNED (Phase 4) | — | — |
| Bad Excel import | Backup snapshot before import | VERIFIED (legacy) | Passes |

## 10. Security checklist

| Item | Status | Notes |
|:---|:---|:---|
| No secrets in tracked files | VERIFIED | `.env.local` & `.env` gitignored; `.env.example` committed with placeholders; `git grep -i "admin123"` clean |
| Passwords hashed | N/A | Handled in Phase 6 |
| Demo credentials in code | VERIFIED | Hardcoded credentials eliminated |
| Open-in-view disabled | VERIFIED | Explicitly set `spring.jpa.open-in-view: false` in `application.yml` |
| CORS restricted | PLANNED (Phase 1) | Spring Boot security config |

## 11. Known issues, shortcuts and risks

1. **Docker Desktop Engine Stopped on Host:** Running `docker compose up -d` / `docker-compose up -d` fails with: `open //./pipe/docker_engine: The system cannot find the file specified`. MySQL 8 cannot start until the user starts Docker Desktop.
2. **Runtime Verification Pending Docker:** Since MySQL is offline, the Spring Boot application cannot run its Flyway baseline or expose `/actuator/health` and Swagger UI. Marked **NOT VERIFIED**.
3. **Local JDK is 17.0.17:** Configured `pom.xml` with `<java.version>17</java.version>` matching the installed JDK. Spring Boot 4 baseline requires Java 17+.
4. Firebase web API key in git history (action for Nishanth: restrict in Google Cloud Console).

## 12. Decisions (ADRs)

1. `docs/adr/0001-spring-boot-core-python-vision.md` — Decoupled Spring Boot Core Platform and Python Vision Service.
2. `docs/adr/0002-mysql.md` — Relational persistence with MySQL 8.x and Flyway schema migrations.

## 13. Open questions for Nishanth & Resolutions

1. **"No target shelf" rule resolution (Prompt 0.2 finding):**
   - Mode A (Default): Shelf Audit (`target_shelf` set). Misplacement detected when `book.shelf != target_shelf`.
   - Mode B: Free-Form / Whole Library (`target_shelf` is null). Scanned books are available, unscanned are missing/issued, uncataloged are misplaced.
2. Default audit session mode: Shelf-by-shelf with optional whole-library mode.

## 14. Verification log

| Date | Command run | Result summary |
|:---|:---|:---|
| 2026-11-08 | `git tag -a phase-0-verified` | Tagged and pushed to origin (b2c0a17) |
| 2026-11-08 | `mvn -N wrapper:wrapper` | Generated Maven wrapper in `core-platform/` (Maven 3.9.16) |
| 2026-11-08 | `docker compose up -d` | FAILED: `open //./pipe/docker_engine: The system cannot find the file specified` (NOT VERIFIED) |
| 2026-11-08 | `docker-compose up -d` | FAILED: `open //./pipe/docker_engine: The system cannot find the file specified` (NOT VERIFIED) |
| 2026-11-08 | `/actuator/health` check | NOT VERIFIED (blocked on MySQL container startup) |
| 2026-11-08 | Swagger UI check | NOT VERIFIED (blocked on MySQL container startup) |

## Changelog (newest first)

- 2026-11-08 | Prompt 1.1 Corrections: Upgraded to Spring Boot 4.0.0 (Spring Framework 7, Jakarta EE 11), aligned Java baseline to 17 to match installed JDK `17.0.17`, configured modular `spring-boot-starter-webmvc`, integrated `springdoc-openapi-starter-webmvc-ui:3.0.0`, documented merge rationale for commit `c903bd9`, and executed verification commands reporting honest NOT VERIFIED status due to inactive Docker daemon.
- 2026-11-08 | Milestone Tag: Tagged and pushed `phase-0-verified`.
- 2026-11-03 | Phase 0: Verification & Remediation: Created scaffolding, ADR 0002, 30-book fixtures, sanitized credentials, and updated legacy scripts.

# Libro-Bot — Project Status (end to end)
Last updated: 2026-11-14 19:30 IST
Current branch: librobot2.0
Last prompt completed: Prompt 1.3 — Inventory Module: Book CRUD, Bulk Delete, and RFC 7807 Error Handling
Next prompt to run: Prompt 1.4 — Import/Export with Apache POI: Auto-matching, Deduplication, Backup, Undo

## 1. Overall progress

- [x] **Phase 0: Preparation** — VERIFIED
  - [x] Create monorepo skeleton (`core-platform/`, `vision-service/`, `landing/`, `legacy/backend/`, `legacy/data/`) — VERIFIED
  - [x] Write ADRs (`docs/adr/0001-spring-boot-core-python-vision.md` and `docs/adr/0002-mysql.md`) — VERIFIED
  - [x] Read legacy `app.py` fully, produce `docs/legacy-behaviour.md` — VERIFIED
  - [x] Capture ~30 sample books and edge-case test fixtures in `samples/fixtures/audit_fixtures.json` — VERIFIED
  - [x] Remove hard-coded demo credentials from tracked files; `git grep` clean — VERIFIED
  - [x] Fix `Start_Libro_Bot.bat` and `setup.bat` to reference `legacy/backend/` — VERIFIED
- [ ] **Phase 1: Spring Boot core, parity without vision** — IN PROGRESS
  - [x] 1. Generate project (WebMVC, Validation, Data JPA, MySQL 8, Flyway, Actuator, OpenAPI) — IMPLEMENTED
  - [x] 2. Flyway migrations for core tables (books, shelves, audit_sessions, scan_events, import_jobs) & JPA entities — IMPLEMENTED (TESTCONTAINERS RUN: NOT VERIFIED PENDING DOCKER)
  - [x] 3. Inventory module: Book CRUD, bulk delete, search/pagination, RFC 7807 problem details — IMPLEMENTED (TESTCONTAINERS RUN: NOT VERIFIED PENDING DOCKER)
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
  - `origin/main` (original): `d57f3f70e8b15d0ecfcbf51600f6ee4a8525b6a7`
  - `origin/main` (current): `506341250c27f6e72dddf7ac090128df280acd62` (5 README documentation commits previously pushed by Nishanth, plus README clarification commit `5063412` requested explicitly by Nishanth on 2026-11-10)
- Phase tags created: `phase-0-complete`, `phase-0-verified`
- Open `task/*` branches: none

## 3. System as it exists right now

The repository is structured as a **monorepo**:
- `core-platform/` — Spring Boot 4.1.2 application (Java 17 LTS, modular WebMVC, Springdoc 3.0.0, dedicated Flyway & Testcontainers starters, baseline V1 through V6 migrations, full JPA domain model).
- `vision-service/` — FastAPI edge vision service skeleton (README present, implementation in Phase 2).
- `landing/` — SaaS marketing site skeleton (README present, implementation in Phase 8).
- `legacy/backend/` — Original Flask backend preserved read-only for behavior parity.
- `legacy/data/` — Original sample database and shelf mapping.
- `frontend/` — React 18 + Vite frontend.
- `docker-compose.yml` — Root orchestration for `mysql:8.0` with healthcheck and named volume.

### Services and ports
| Service | Tech | Port | How to start | Status |
|:---|:---|:---|:---|:---|
| Core Platform | Spring Boot 4.1.2 + Java 17 | `8080` | `cd core-platform && .\mvnw.cmd spring-boot:run` | NOT VERIFIED (blocked on MySQL) |
| Database | MySQL 8.0 (Docker) | `3306` | `docker compose up -d` | NOT VERIFIED (Docker Desktop stopped) |
| Legacy Backend | Python Flask + Socket.IO + Eventlet | `5000` | `cd legacy/backend && venv\Scripts\python.exe app.py` | VERIFIED |
| Frontend | React 18 + Vite | `3000` | `cd frontend && npm run dev` | VERIFIED |

## 4. Core platform (Spring Boot)

- **Framework:** Spring Boot 4.1.2 (Spring Framework 7, Jakarta EE 11)
- **Language Target:** Java 17 LTS (aligned with installed OpenJDK 17.0.17)
- **Build Tool:** Apache Maven with committed Maven wrapper (`mvnw`, `mvnw.cmd`, `.mvn/`)
- **Modules & Domain Entities:**
  - `iam`: `Tenant` (`tenants`)
  - `inventory`: `Shelf` (`shelves`), `Book` (`books`), `BookStatus`, `ImportJob` (`import_jobs`), `ImportJobStatus`
  - `audit`: `AuditSession` (`audit_sessions`), `AuditSessionStatus`, `ScanEvent` (`scan_events`), `AuditClassification`
  - `common`: Shared exceptions and utilities
  - `reports`, `circulation`, `billing`, `realtime`: Modular packages present
- **Database Migrations (Flyway V1–V6):**
  - `V1__baseline.sql`: `tenants` table + `default-tenant` seed
  - `V2__create_shelves_table.sql`: `shelves` table with `(tenant_id, code)` unique constraint
  - `V3__create_books_table.sql`: `books` table with `utf8mb4_bin` exact barcode collation, `(tenant_id, barcode)` unique constraint, and `(tenant_id, shelf_code)` index
  - `V4__create_audit_sessions_table.sql`: `audit_sessions` table with `CHAR(36)` boundary ID and tenant status index
  - `V5__create_scan_events_table.sql`: `scan_events` table with `CHAR(36)` unique `event_id`, `utf8mb4_bin` barcode collation, and composite `(session_id, barcode)` index
  - `V6__create_import_jobs_table.sql`: `import_jobs` table with `CHAR(36)` boundary ID, undo backup reference, and status tracking
- **Configuration & Validation:**
  - `spring.jpa.open-in-view: false`
  - `spring.jpa.hibernate.ddl-auto: validate`
- **Testing:**
  - `SchemaValidationTest.java`: Testcontainers MySQL 8.0 integration test validating complete Flyway migration application and Hibernate entity validation.

## 5. Vision service (Python)

Scaffolding created (`vision-service/README.md`). Scheduled for Phase 2.

## 6. Frontend

All pages currently talk to legacy Flask backend at `http://127.0.0.1:5000`. Frontend migration to Spring Boot occurs in Phase 3.

## 7. Data

- **Database:** MySQL 8.0 schema managed via Flyway (`V1` to `V6`)
- **Reference Catalog:** `samples/fixtures/audit_fixtures.json` (30 books catalog, 5 scenarios)
- **Legacy Sample:** `legacy/data/books_database_sample.xlsx`

## 8. Tests and quality

- Characterization fixtures: 5 scenarios in `samples/fixtures/audit_fixtures.json` — VERIFIED.
- Schema validation test: `SchemaValidationTest.java` — IMPLEMENTED, NOT VERIFIED (pending host Docker execution).

## 9. Resilience scenarios

| Scenario | Implemented | Tested | Result |
|:---|:---|:---|:---|
| Vision service down | PLANNED (Phase 4) | — | — |
| Camera disconnected | Partial (backoff in Flask) | NOT TESTED | — |
| Core down | PLANNED (Phase 4) | — | — |
| Core slow | PLANNED (Phase 4) | — | — |
| Duplicate event delivery | Unique `event_id` in V5 | PLANNED (Phase 1.5) | — |
| Database down | PLANNED (Phase 4) | — | — |
| Bad Excel import | Backup snapshot ref in V6 | VERIFIED (legacy) | Passes |

## 10. Security checklist

| Item | Status | Notes |
|:---|:---|:---|
| No secrets in tracked files | VERIFIED | `.env.local` & `.env` gitignored; `.env.example` committed with placeholders; `git grep -i "admin123"` clean |
| Passwords hashed | N/A | Handled in Phase 6 |
| Demo credentials in code | VERIFIED | Hardcoded credentials eliminated |
| Open-in-view disabled | VERIFIED | Explicitly set `spring.jpa.open-in-view: false` in `application.yml` |
| CORS restricted | PLANNED (Phase 1) | Spring Boot security config |

## 11. Known issues, shortcuts and risks

1. **Docker Desktop Engine Stopped on Host:** Sandbox has no access to Docker daemon. User will run `SchemaValidationTest` in their own terminal once Docker Desktop is launched.
2. **Schema Test Status:** Marked as **NOT VERIFIED** until Nishanth runs the test and provides output.
3. Firebase web API key in git history (action for Nishanth: restrict in Google Cloud Console).

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
| 2026-11-08 | `docker compose up -d` | FAILED: `open //./pipe/docker_engine: not found` (NOT VERIFIED) |
| 2026-11-08 | `.\mvnw.cmd test -Dtest=SchemaValidationTest` | NOT VERIFIED (pending host Docker startup by Nishanth) |

## Changelog (newest first)

- 2026-11-14 | Prompt 1.3: Inventory Module & Book REST Endpoints: Implemented BookController, BookService, BookRepository with tenant filtering via TenantContext, immutable DTO records with Bean Validation, BookMapper, BookSpecifications, RFC 7807 GlobalExceptionHandler (409 Conflict for duplicate barcodes, 404 Not Found), unit tests (BookServiceTest), and Testcontainers integration tests (BookControllerIntegrationTest).
- 2026-11-10 | Docs sync: Updated `core-platform/README.md` to reflect Spring Boot 4.1.2 / Flyway / Testcontainers stack on `librobot2.0`, and clarified database/report formats in root `README.md` on `main` per Nishanth's request.
- 2026-11-08 | Prompt 1.2: Core Flyway Migrations & JPA Entities: Created Flyway migrations V2 through V6 (InnoDB, utf8mb4, utf8mb4_bin barcode collation, cross-service CHAR(36) IDs, internal BIGINT IDs, tenant partitioning), authored full JPA entity model (`Tenant`, `Shelf`, `Book`, `AuditSession`, `ScanEvent`, `ImportJob`), created `SchemaValidationTest.java` with Testcontainers, and documented ddl-auto=validate rationale.
- 2026-11-08 | Quick fix: Upgraded to Spring Boot 4.1.2 with dedicated `spring-boot-starter-flyway` and Testcontainers starters.
- 2026-11-08 | Prompt 1.1 Corrections: Upgraded to Spring Boot 4.x, Java 17 baseline, documented merge commit c903bd9, and established honest verification reporting.

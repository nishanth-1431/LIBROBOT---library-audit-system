# ADR 0002: Relational Persistence with MySQL 8.x and Flyway

- **Status:** Accepted
- **Date:** 2026-11-03
- **Deciders:** Nishanth (Author), AI Engineering Assistant
- **Technical Context:** Libro-Bot 2.0 Core Platform Database Selection

---

## 1. Context and Problem Statement

The legacy prototype used an Excel workbook (`books_database.xlsx`) loaded entirely into memory by Pandas at startup. Writes required writing back to disk (`to_excel`), which caused:
1. **Concurrency Failures:** Concurrent read/write requests caused OS-level `PermissionError` when the file was accessed simultaneously or inspected in Office.
2. **Lack of Relational Constraints:** Foreign keys (e.g., linking audit sessions to scanned barcode events, or book checkout records to user/member IDs) did not exist.
3. **No Transactional Boundaries:** A crash mid-write corrupted the spreadsheet or dropped changes.
4. **Multi-Tenancy Bottleneck:** Storing multiple colleges/libraries in separate Excel files or a flat table is fragile, unindexed, and insecure.

The Core Platform needs an ACID-compliant transactional relational database capable of multi-tenant row partitioning (`tenant_id`), high-throughput scan event ingestion, and strict schema version control.

---

## 2. Decision

We will use **MySQL 8.x** with the **InnoDB storage engine** and **`utf8mb4` character set**, managed via **Flyway database migrations**:

1. **Relational Schema:** Core tables (`tenants`, `users`, `books`, `shelf_maps`, `audit_sessions`, `audit_events`, `circulation_records`) with primary keys, foreign key constraints, and indexes on `(tenant_id, barcode)` and `(tenant_id, session_id)`.
2. **Schema Versioning with Flyway:**
   - Every database change is committed as an immutable, versioned SQL migration script in `src/main/resources/db/migration/V{n}__{description}.sql`.
   - `spring.jpa.hibernate.ddl-auto` is set to `validate` in all environments, ensuring Hibernate never generates or alters tables directly.
3. **Local & Production Execution:**
   - Local development uses a local MySQL 8.0 instance or standard Docker Compose container (`mysql:8.0`).
   - Automated integration tests use **Testcontainers** (`testcontainers-mysql`) to spin up real, isolated MySQL instances during Maven test runs.

---

## 3. Options Considered

### Option A: Retain Flat Files / SQLite
- *Pros:* Zero setup, single-file storage.
- *Cons:* SQLite locks the entire database file during writes, creating bottlenecks when camera streams produce high-frequency barcode scan events. Does not represent production enterprise architecture for placement evaluation.

### Option B: PostgreSQL
- *Pros:* Excellent JSON support, strict ACID, enterprise features.
- *Cons:* The master plan and curriculum specifications specifically designate MySQL 8 as the chosen enterprise RDBMS for Nishanth's placement showcase. MySQL 8 meets all indexing, locking, and multi-tenant partitioning needs.

### Option C: MySQL 8.x with Flyway (Chosen)
- *Pros:*
  - Robust row-level locking (InnoDB) for high-frequency scan-event ingestion.
  - Native standard RDBMS matching campus recruitment expectations for enterprise Java roles.
  - Flyway ensures reproducible, auditable migrations across dev, test, and production environments.
  - Full compatibility with Testcontainers for deterministic automated testing.

---

## 4. Consequences and Invariants

- **Invariant 1:** No JPA entity will rely on `ddl-auto: update` or `ddl-auto: create`. All DDL must be explicitly defined in Flyway SQL files.
- **Invariant 2:** Every business table must include `tenant_id VARCHAR(36) NOT NULL` and compound indexes including `tenant_id` to enforce multi-tenant isolation.
- **Invariant 3:** All string columns holding titles, author names, or notes must use `utf8mb4` to support multilingual library metadata.

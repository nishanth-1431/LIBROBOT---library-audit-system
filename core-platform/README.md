# Libro-Bot — Core Platform (Spring Boot)

Enterprise transactional core for Libro-Bot:
- **Stack:** Java 17 LTS, Spring Boot 4.1.2 (Spring Framework 7, Jakarta EE 11), MySQL 8.0, Flyway, Testcontainers, springdoc-openapi 3.0.0.
- **Responsibilities:** Owns all inventory, shelves, audit sessions, scan event ingestion, classification logic, Word/Excel report generation, multi-tenancy, and STOMP WebSocket push.
- **Schema & Entities (Phase 1, Task 2):**
  - Flyway migrations `V1`–`V6` (`tenants`, `shelves`, `books`, `audit_sessions`, `scan_events`, `import_jobs`)
  - JPA entities with `spring.jpa.hibernate.ddl-auto=validate` and `spring.jpa.open-in-view=false`
- **Verification (requires Docker Desktop running):**
  ```powershell
  .\mvnw.cmd test -Dtest=SchemaValidationTest
  ```

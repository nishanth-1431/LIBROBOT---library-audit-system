# ADR 0001: Separation of Spring Boot Core Platform and Python Vision Service

- **Status:** Accepted
- **Date:** 2026-11-01
- **Deciders:** Nishanth (Author), AI Engineering Assistant
- **Technical Context:** Libro-Bot 2.0 Migration from Flask Prototype to Production/SaaS Architecture

---

## 1. Context and Problem Statement

The original Libro-Bot prototype was built as a single Python Flask monolithic application (`backend/app.py`). It handled hardware camera capture, PyZbar barcode decoding, in-memory Pandas/Excel inventory manipulation, reporting (python-docx), and WebSocket communication.

While functional as an initial hackathon/demo prototype, this design had critical limitations:
1. **Concurrency and Reliability:** OpenCV and video streaming threads ran in the same GIL-bound Python process as business logic and file I/O. Camera lag or blocking file writes impacted barcode processing and web requests.
2. **Data Integrity:** Managing library inventory in Excel (`books_database.xlsx`) via Pandas resulted in file locking issues (`PermissionError`), lack of transactions, zero foreign key integrity, and no multi-user concurrency.
3. **Hardware Coupling vs Cloud Deployment:** The camera must run locally on the machine physically connected to the hardware scanner / cart, whereas library management systems, databases, multi-tenant billing, and admin dashboards belong on robust server infrastructure or cloud.
4. **Placement and Showcase Objective:** The core business platform must serve as a rigorous enterprise Java showcase (Spring Boot, MySQL, Flyway, JPA, modular monolith architecture).

---

## 2. Decision

We will divide the system into **two distinct deployable services** and one frontend application:

1. **Core Platform (Spring Boot / Java 21+):**
   - **Role:** "The Brain". Owns all business logic, data persistence (MySQL 8 with Flyway), audit session state machines, inventory classification, circulation (issues/returns), reporting (Apache POI), multi-tenancy, authentication, and WebSocket push.
   - **Boundary Principle:** Core never touches physical cameras, frames, or image pixels directly. It receives normalized scan events (`{ barcode, timestamp, scannerId, confidence }`) over REST/HTTP.

2. **Vision Service (FastAPI / Python 3.11+):**
   - **Role:** "The Eyes". Owns camera capture (`FrameSource`), image decoding (OpenCV, PyZbar, future OCR/color hints), MJPEG video feed streaming to the local UI, and event publication.
   - **Resilience:** Contains a local persistent write-ahead buffer (SQLite / JSONL) to queue scan events if the Core platform is temporarily slow or unreachable, replaying them with backoff when connectivity resumes.
   - **Boundary Principle:** Vision service is stateless regarding library inventory. It knows nothing about books, shelves, users, or borrow records. It merely detects barcodes and pushes observations.

3. **Frontend (React 18 / Vite):**
   - Consumes Core REST APIs and STOMP WebSockets for data, audit status, and admin controls.
   - Points directly to the Vision Service endpoint (`/video_feed`) solely for the raw live video stream.

---

## 3. Options Considered

### Option A: Pure Python Monolith (FastAPI + SQLAlchemy)
* *Pros:* Single language, simple deployment for local-only use.
* *Cons:* Python does not meet the key campus placement criteria for enterprise Java architecture; GIL bottlenecks remain between video decoding and high-throughput transaction processing.

### Option B: Pure Java (Spring Boot with JavaCV / OpenCV bindings)
* *Pros:* Single runtime environment.
* *Cons:* Native camera bindings (OpenCV / FFmpeg via JNI) are notorious for platform-specific crashes, memory leaks in the JVM, and poor cross-platform driver compatibility on Windows. Python has far superior native hardware integration, PyZbar stability, and AI/vision library ecosystem.

### Option C: Decoupled Python Vision + Spring Boot Core (Chosen)
* *Pros:*
  * "Right tool for the right job": Python for computer vision and hardware; Java/Spring Boot for robust transactional business domains, security, and enterprise data models.
  * Clear architectural boundary: Vision only sees; Core only decides.
  * Allows edge deployment: Vision service can run as a lightweight daemon on the library cart or Raspberry Pi / local Windows PC, while Core runs locally or in the cloud.
  * High-scoring academic and industry architecture: Demonstrates distributed systems resilience, event-driven integration, idempotency, and clean modular architecture.
* *Cons:*
  * Two separate runtimes (JVM + Python virtual environment) must be started and maintained during local development. Mitigated with unified start scripts and Docker Compose.

---

## 4. Consequences and Invariants

* **Invariant 1:** The Vision service will **never** query the MySQL database or duplicate classification rules (e.g., determining whether a book is "misplaced" vs "available").
* **Invariant 2:** Communication from Vision to Core must be asynchronous and idempotent (`eventId` / deduplication keys) to prevent duplicate scans from corrupting audit metrics.
* **Invariant 3:** Core must remain operable even if Vision crashes or disconnects (manual scanning or test fixtures still work).

# Libro-Bot — Legacy Behavior Specification (Flask Prototype)

- **Source File:** `legacy/backend/app.py`
- **Specification Date:** 2026-11-01
- **Status:** Complete & Verified against `legacy/backend/app.py`
- **Purpose:** Definitive reference for behavior parity during the Spring Boot Core and Python Vision service migration.

---

## 1. Domain Data Model & Storage

### 1.1 Canonical Schema
In the legacy system, inventory data is stored in Excel (`data/books_database.xlsx`) with exactly 6 columns:

| Column Header | Type | Description / Constraints | Default Value |
| :--- | :--- | :--- | :--- |
| `Barcode` | String | Unique book identifier / accession number. Leading/trailing spaces trimmed, trailing `.0` (from Excel numeric parsing) removed. | Required, Non-empty |
| `Book Name` | String | Title of the book. | `'Unknown Book'` |
| `Author` | String | Author name(s). | `'Unknown Author'` |
| `Department` | String | Academic department or category. | `'General'` |
| `Status` | String | Inventory state (`'Available'`, `'Issued'`). Case-insensitive comparisons in logic. | `'Available'` |
| `Shelf` | String | Shelf label / rack code (e.g., `'A1'`, `'B1'`). | Resolved via `SHELF_MAP` based on Department; fallback `'A1'` |

### 1.2 Shelf Mapping (`shelf_map.json`)
Department-to-shelf mapping is persisted in JSON format:
```json
{
  "General": "A1",
  "Civil Engineering": "B1",
  "Computer Science": "C1",
  "Electrical Engineering": "D1",
  "Mechanical Engineering": "E1",
  "Electronics": "F1",
  "Information Technology": "G1",
  "Mathematics": "H1",
  "Physics": "H2",
  "Chemistry": "H3",
  "English": "I1",
  "Management": "J1"
}
```
* **Resolution rule:** Case-insensitive lookup matching department name. If empty, `'nan'`, or unmapped, defaults to `'A1'`.

---

## 2. Inventory Import & Deduplication Rules

The `POST /api/books/import` endpoint handles `.xlsx`, `.xls`, `.csv`, and `.ods` files via `standardize_df(df)`:

### 2.1 Fuzzy Column Auto-Matching
Incoming file column names are inspected case-insensitively using substring matching:
* **Barcode:** Column name containing `'barcode'`, `'access'`, or `'id'`
* **Book Name:** Column name containing `'name'`, `'book'`, or `'title'`
* **Author:** Column name containing `'author'` or `'writer'`
* **Department:** Column name containing `'dept'`, `'subject'`, `'category'`, `'class'`, or `'department'`
* **Status:** Column name containing `'status'`
* **Shelf:** Column name containing `'shelf'` or `'rack'`

### 2.2 Deduplication & Merge Semantics
1. **Backup on Import:** Prior to importing, `books_database.xlsx` is copied to `books_database_backup.xlsx`.
2. **Merge Strategy:** The existing database and the standardized new records are concatenated.
3. **Collision Policy:** `df.drop_duplicates(subset=['Barcode'], keep='last')` — **last-write-wins**. Uploaded records overwrite existing database records with the same barcode.
4. **Undo Support:** `POST /api/books/undo_import` restores `books_database_backup.xlsx` back to `books_database.xlsx` and deletes the backup file.

---

## 3. Core Audit Classification Logic (`build_status()`)

Audit state computation takes three inputs:
1. `books_db`: Complete registry of registered books keyed by barcode.
2. `scanned_books`: Set of unique barcodes detected during the session.
3. `target_shelf`: Shelf identifier selected for audit (or `None` for full library).

### 3.1 Classification Rules Matrix

| Condition | In DB? | Was Barcode Scanned? | Target Shelf Filter | Registered Status | Classification Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Rule 1** | Yes | Yes | `target_shelf` is set AND `book.shelf != target_shelf` | Any | **`misplaced`** (with `found_on_shelf = target_shelf`) |
| **Rule 2** | Yes | Yes | `target_shelf` is None OR `book.shelf == target_shelf` | Any | **`available`** |
| **Rule 3** | Yes | No | `target_shelf` is set AND `book.shelf == target_shelf` | `'Issued'` (case-insensitive) | **`safely_issued`** |
| **Rule 4** | Yes | No | `target_shelf` is set AND `book.shelf == target_shelf` | Not `'Issued'` (e.g. `'Available'`) | **`missing`** |
| **Rule 5** | Yes | No | `target_shelf` is set AND `book.shelf != target_shelf` | Any | *Ignored* (book belongs to another shelf not currently under audit) |
| **Rule 6** | Yes | No | `target_shelf` is None | `'Issued'` (case-insensitive) | **`safely_issued`** |
| **Rule 7** | Yes | No | `target_shelf` is None | Not `'Issued'` (e.g. `'Available'`) | **`missing`** |
| **Rule 8** | No | Yes | Any | N/A | **`misplaced`** (`name: "Unknown Book"`, `shelf: "Unknown"`, `found_on_shelf: target_shelf or "Unknown"`) |

---

## 4. REST API Endpoint Reference

| Method | Path | Request Body / Params | Status Codes | Response Structure / Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | None | `200` | `{"status": "healthy", "message": "Libro-Bot Backend Running"}` |
| `GET` | `/status` | None | `200` | Returns `build_status()` JSON (`available`, `missing`, `safely_issued`, `misplaced`, `target_shelf`). |
| `GET` | `/video_feed` | None | `200` | MJPEG video stream (`multipart/x-mixed-replace; boundary=frame`). |
| `GET` | `/api/shelves` | None | `200` | `{"shelf_map": {...}, "shelves_in_use": ["A1", "B1", ...]}` |
| `POST` | `/api/settings/shelf_map` | JSON object mapping dept $\rightarrow$ shelf | `200`, `400` | Updates `shelf_map.json` and in-memory map. |
| `GET` | `/api/target_shelf` | None | `200` | `{"target_shelf": "<shelf>" or null}` |
| `POST` | `/api/target_shelf` | `{"shelf": "<shelf_name>"}` | `200` | Sets target shelf, triggers Socket.IO `status_update`. |
| `GET` | `/api/departments` | None | `200` | `{"departments": ["Civil Engineering", ...]}` |
| `GET` | `/api/books` | None | `200` | Dictionary of all books keyed by barcode. |
| `POST` | `/api/books/reload` | None | `200`, `423` | Re-reads `books_database.xlsx`. Returns 423 if locked. |
| `POST` | `/api/books` | `{"barcode", "name", "author", "department"?, "shelf"?}` | `201`, `400`, `500` | Creates book; rejects duplicate barcode. Appends to Excel. |
| `PUT` | `/api/books/<barcode>` | `{"name"?, "author"?, "department"?, "status"?, "shelf"?}` | `200`, `404`, `500` | Updates book attributes in memory and Excel. |
| `DELETE` | `/api/books/<barcode>` | None | `200`, `404`, `500` | Deletes book from memory and Excel. |
| `POST` | `/api/books/bulk-delete`| `{"barcodes": ["1001", "1002"]}` | `200`, `400`, `500` | Batch deletes books matching array of barcodes. |
| `POST` | `/api/books/import` | `multipart/form-data` with `file` | `200`, `400`, `500` | Merges file with existing DB (last-write-wins). Backs up previous DB. |
| `POST` | `/api/books/undo_import`| None | `200`, `400`, `500` | Restores DB from `books_database_backup.xlsx` and deletes backup. |
| `GET` | `/api/books/export` | Query param `format` (`xlsx`\|`csv`\|`ods`) | `200`, `404`, `500` | File download of complete inventory. |
| `POST` | `/reset_session` | None | `200` | Clears `scanned_books` and `scan_records`; resets start time; emits `session_reset`. |
| `POST` | `/camera_control` | `{"action": "START"|"STOP"|"PAUSE", "config"?}` | `200`, `400` | Updates camera worker state and camera index/resolution. Emits `camera_state_changed`. |
| `GET` | `/api/config` | None | `200` | `{"camera": {"index": 0, "width": 640, "height": 480}, "db_file": "<path>"}` |
| `GET` | `/export_word` | None | `200`, `500` | Generates and downloads Word report `.docx`. |

---

## 5. Word Audit Report Structure (`/export_word`)

The generated Word document contains:
1. **Document Header:** "Libro-Bot Audit Report" (Heading 0).
2. **Metadata Paragraphs:**
   * Scan Operator: `Library Admin`
   * Session ID: `LBR-<random 5-digit number>` (e.g. `LBR-48291`)
   * System Version: `Libro-Bot Core v2.0`
   * Report Generated: `YYYY-MM-DD HH:MM:SS`
3. **Summary Section (Heading 1):**
   * Target Shelf: Target shelf name or `'All Shelves'`
   * Session Duration: Elapsed seconds
   * Avg Scan Speed: Seconds per book (`session_dur / scan_records_count`), or `'N/A'`
   * Found (Available) count
   * Missing count
   * Safely Issued count
   * Misplaced (Wrong Shelf) count
4. **Missing Books Section (Heading 1):**
   * If missing > 0: Grouped by shelf (Heading 2: `Shelf <shelf_code>`), 4-column Table Grid (`Barcode`, `Book Name`, `Author`, `Department`).
   * If missing == 0: Paragraph `"All books accounted for!"`.
5. **Misplaced Books Section (Heading 1):**
   * If misplaced > 0: Warning paragraph, 4-column Table Grid (`Barcode`, `Book Name`, `Registered Shelf`, `Found On Shelf`).
   * If misplaced == 0: Paragraph `"No misplaced items detected."`.

---

## 6. Realtime WebSocket Events (Socket.IO)

* `connect`: Emits `initial_state` with current `build_status()` payload plus `camera_state`.
* `new_scan`: Emitted whenever vision thread decodes an unseen barcode in the current session.
  ```json
  {
    "barcode": "1001",
    "book": { ... },
    "status": "available" | "misplaced" | "unknown",
    "full_status": { ... }
  }
  ```
* `status_update`: Emitted when target shelf is updated via `/api/target_shelf`.
* `session_reset`: Emitted when `/reset_session` is called.
* `camera_state_changed`: Emitted when camera state or resolution is adjusted.

---

## 7. Known Behavioral Gaps & Quirks to Address in Core

1. **Circulation Routes Missing:** The frontend calls `/api/books/checkout` and `/api/books/return`, but these did not exist in Flask (`404`). Phase 1 will implement full issue/return tracking.
2. **Global Mutable State:** Target shelf, scanned books, and camera state lived in process memory without multi-tenant partitioning or session persistence. Spring Boot will introduce persistent `audit_sessions` and `audit_events`.
3. **No Barcode De-duplication Window:** Vision worker processed frames with simple set containment (`barcode not in scanned_books`), meaning once scanned in a session it was never re-evaluated if moved.
4. **Concurrent Writes:** Modifying Excel via Pandas was prone to file locking; MySQL with transactional ACID guarantees replaces this entirely.

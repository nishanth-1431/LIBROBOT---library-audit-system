# Libro-Bot — Vision Service (FastAPI)

Edge computer vision service for Libro-Bot:
- **Stack:** Python 3.11+, FastAPI, OpenCV, PyZbar, SQLite local buffer.
- **Responsibilities:** Owns USB/edge camera capture (`FrameSource`), barcode decoding, MJPEG streaming (`/video_feed`), and resilient event publishing to Core.
- **Status:** Scaffolding created in Phase 0; generation starts in Phase 2.

-- V5__create_scan_events_table.sql
-- Scan events ingested from Python vision edge service (idempotent event_id: CHAR(36))

CREATE TABLE IF NOT EXISTS scan_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    session_id CHAR(36) NOT NULL,
    event_id CHAR(36) NOT NULL UNIQUE,
    barcode VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    detected_shelf VARCHAR(64) NULL,
    classification VARCHAR(32) NOT NULL,
    confidence DOUBLE NULL,
    scanned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(64) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scan_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_scan_events_session FOREIGN KEY (session_id) REFERENCES audit_sessions(id) ON DELETE CASCADE,
    INDEX idx_scan_events_session_barcode (session_id, barcode),
    INDEX idx_scan_events_tenant_session (tenant_id, session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

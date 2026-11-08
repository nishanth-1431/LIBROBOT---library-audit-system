-- V1__baseline.sql
-- Baseline schema establishing tenant partitioning foundation for Libro-Bot

CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial default tenant seed for single-tenant / local development mode
INSERT INTO tenants (id, name, slug, status)
VALUES ('default-tenant', 'SREC Central Library', 'srec-central', 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name);


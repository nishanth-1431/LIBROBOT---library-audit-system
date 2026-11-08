-- V3__create_books_table.sql
-- Books catalog table with exact binary barcode collation and tenant scoping

CREATE TABLE IF NOT EXISTS books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    barcode VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    title VARCHAR(512) NOT NULL,
    author VARCHAR(255) NULL,
    department VARCHAR(128) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    shelf_code VARCHAR(64) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_books_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_books_tenant_barcode UNIQUE (tenant_id, barcode),
    INDEX idx_books_tenant_shelf (tenant_id, shelf_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

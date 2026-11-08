package com.librobot.inventory;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
    name = "import_jobs",
    indexes = {
        @Index(name = "idx_import_jobs_tenant_status", columnList = "tenant_id, status")
    }
)
public class ImportJob {

    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private ImportJobStatus status = ImportJobStatus.PENDING;

    @Column(name = "rows_ok", nullable = false)
    private int rowsOk = 0;

    @Column(name = "rows_failed", nullable = false)
    private int rowsFailed = 0;

    @Column(name = "backup_ref", length = 255)
    private String backupRef;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public ImportJob() {}

    public ImportJob(String id, String tenantId, String fileName) {
        this.id = id;
        this.tenantId = tenantId;
        this.fileName = fileName;
        this.status = ImportJobStatus.PENDING;
        this.rowsOk = 0;
        this.rowsFailed = 0;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public ImportJobStatus getStatus() { return status; }
    public void setStatus(ImportJobStatus status) { this.status = status; }

    public int getRowsOk() { return rowsOk; }
    public void setRowsOk(int rowsOk) { this.rowsOk = rowsOk; }

    public int getRowsFailed() { return rowsFailed; }
    public void setRowsFailed(int rowsFailed) { this.rowsFailed = rowsFailed; }

    public String getBackupRef() { return backupRef; }
    public void setBackupRef(String backupRef) { this.backupRef = backupRef; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ImportJob importJob = (ImportJob) o;
        return Objects.equals(id, importJob.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

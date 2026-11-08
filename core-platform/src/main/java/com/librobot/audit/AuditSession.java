package com.librobot.audit;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
    name = "audit_sessions",
    indexes = {
        @Index(name = "idx_audit_sessions_tenant_status", columnList = "tenant_id, status")
    }
)
public class AuditSession {

    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "started_by", length = 255)
    private String startedBy;

    @Column(name = "target_shelf", length = 64)
    private String targetShelf;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private AuditSessionStatus status = AuditSessionStatus.ACTIVE;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "camera_source", length = 64)
    private String cameraSource;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public AuditSession() {}

    public AuditSession(String id, String tenantId, String startedBy, String targetShelf, String cameraSource) {
        this.id = id;
        this.tenantId = tenantId;
        this.startedBy = startedBy;
        this.targetShelf = targetShelf;
        this.status = AuditSessionStatus.ACTIVE;
        this.startedAt = Instant.now();
        this.cameraSource = cameraSource;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getStartedBy() { return startedBy; }
    public void setStartedBy(String startedBy) { this.startedBy = startedBy; }

    public String getTargetShelf() { return targetShelf; }
    public void setTargetShelf(String targetShelf) { this.targetShelf = targetShelf; }

    public AuditSessionStatus getStatus() { return status; }
    public void setStatus(AuditSessionStatus status) { this.status = status; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getEndedAt() { return endedAt; }
    public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }

    public String getCameraSource() { return cameraSource; }
    public void setCameraSource(String cameraSource) { this.cameraSource = cameraSource; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AuditSession that = (AuditSession) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

package com.librobot.audit;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
    name = "scan_events",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_scan_events_event_id", columnNames = {"event_id"})
    },
    indexes = {
        @Index(name = "idx_scan_events_session_barcode", columnList = "session_id, barcode"),
        @Index(name = "idx_scan_events_tenant_session", columnList = "tenant_id, session_id")
    }
)
public class ScanEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "session_id", nullable = false, length = 36)
    private String sessionId;

    @Column(name = "event_id", nullable = false, unique = true, length = 36)
    private String eventId;

    @Column(
        name = "barcode",
        nullable = false,
        length = 64,
        columnDefinition = "VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin"
    )
    private String barcode;

    @Column(name = "detected_shelf", length = 64)
    private String detectedShelf;

    @Enumerated(EnumType.STRING)
    @Column(name = "classification", nullable = false, length = 32)
    private AuditClassification classification;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "scanned_at", nullable = false)
    private Instant scannedAt = Instant.now();

    @Column(name = "source", length = 64)
    private String source;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ScanEvent() {}

    public ScanEvent(String tenantId, String sessionId, String eventId, String barcode,
                     String detectedShelf, AuditClassification classification,
                     Double confidence, String source) {
        this.tenantId = tenantId;
        this.sessionId = sessionId;
        this.eventId = eventId;
        this.barcode = barcode;
        this.detectedShelf = detectedShelf;
        this.classification = classification;
        this.confidence = confidence;
        this.source = source;
        this.scannedAt = Instant.now();
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getDetectedShelf() { return detectedShelf; }
    public void setDetectedShelf(String detectedShelf) { this.detectedShelf = detectedShelf; }

    public AuditClassification getClassification() { return classification; }
    public void setClassification(AuditClassification classification) { this.classification = classification; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public Instant getScannedAt() { return scannedAt; }
    public void setScannedAt(Instant scannedAt) { this.scannedAt = scannedAt; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ScanEvent scanEvent = (ScanEvent) o;
        return Objects.equals(eventId, scanEvent.eventId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(eventId);
    }
}

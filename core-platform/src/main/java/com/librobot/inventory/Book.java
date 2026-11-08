package com.librobot.inventory;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
    name = "books",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_books_tenant_barcode", columnNames = {"tenant_id", "barcode"})
    },
    indexes = {
        @Index(name = "idx_books_tenant_shelf", columnList = "tenant_id, shelf_code")
    }
)
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(
        name = "barcode",
        nullable = false,
        length = 64,
        columnDefinition = "VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin"
    )
    private String barcode;

    @Column(name = "title", nullable = false, length = 512)
    private String title;

    @Column(name = "author", length = 255)
    private String author;

    @Column(name = "department", length = 128)
    private String department;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private BookStatus status = BookStatus.AVAILABLE;

    @Column(name = "shelf_code", length = 64)
    private String shelfCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Book() {}

    public Book(String tenantId, String barcode, String title, String author, String department, BookStatus status, String shelfCode) {
        this.tenantId = tenantId;
        this.barcode = barcode;
        this.title = title;
        this.author = author;
        this.department = department;
        this.status = status != null ? status : BookStatus.AVAILABLE;
        this.shelfCode = shelfCode;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public BookStatus getStatus() { return status; }
    public void setStatus(BookStatus status) { this.status = status; }

    public String getShelfCode() { return shelfCode; }
    public void setShelfCode(String shelfCode) { this.shelfCode = shelfCode; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Book book = (Book) o;
        return Objects.equals(tenantId, book.tenantId) && Objects.equals(barcode, book.barcode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(tenantId, barcode);
    }
}

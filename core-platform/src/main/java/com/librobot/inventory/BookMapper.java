package com.librobot.inventory;

import com.librobot.inventory.dto.BookResponse;
import com.librobot.inventory.dto.CreateBookRequest;
import com.librobot.inventory.dto.UpdateBookRequest;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Mapper component providing bidirectional conversions between JPA Book entities
 * and API DTO records. Prevents internal entity structures from leaking to the web layer.
 */
@Component
public class BookMapper {

    public BookResponse toResponse(Book book) {
        if (book == null) {
            return null;
        }
        return new BookResponse(
                book.getId(),
                book.getBarcode(),
                book.getTitle(),
                book.getAuthor(),
                book.getDepartment(),
                book.getStatus(),
                book.getShelfCode(),
                book.getCreatedAt(),
                book.getUpdatedAt()
        );
    }

    public Book toEntity(CreateBookRequest request, String tenantId) {
        BookStatus status = request.status() != null ? request.status() : BookStatus.AVAILABLE;
        return new Book(
                tenantId,
                request.barcode().trim(),
                request.title().trim(),
                request.author() != null ? request.author().trim() : null,
                request.department() != null ? request.department().trim() : null,
                status,
                request.shelfCode() != null ? request.shelfCode().trim() : null
        );
    }

    public void updateEntity(Book book, UpdateBookRequest request) {
        book.setTitle(request.title().trim());
        if (request.author() != null) {
            book.setAuthor(request.author().trim());
        }
        if (request.department() != null) {
            book.setDepartment(request.department().trim());
        }
        if (request.status() != null) {
            book.setStatus(request.status());
        }
        if (request.shelfCode() != null) {
            book.setShelfCode(request.shelfCode().trim());
        }
        book.setUpdatedAt(Instant.now());
    }
}

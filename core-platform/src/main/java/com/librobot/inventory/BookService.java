package com.librobot.inventory;

import com.librobot.common.DuplicateResourceException;
import com.librobot.common.ResourceNotFoundException;
import com.librobot.common.TenantContext;
import com.librobot.inventory.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service encapsulating business logic for Book inventory management.
 * Enforces mandatory tenant scoping on every data operation via TenantContext.
 */
@Service
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final BookMapper bookMapper;

    public BookService(BookRepository bookRepository, BookMapper bookMapper) {
        this.bookRepository = bookRepository;
        this.bookMapper = bookMapper;
    }

    public Page<BookResponse> getBooks(
            String query,
            String department,
            String shelfCode,
            BookStatus status,
            Pageable pageable
    ) {
        String tenantId = TenantContext.getTenantId();
        Specification<Book> spec = BookSpecifications.withFilter(tenantId, query, department, shelfCode, status);
        return bookRepository.findAll(spec, pageable).map(bookMapper::toResponse);
    }

    public BookResponse getBookByBarcode(String barcode) {
        String tenantId = TenantContext.getTenantId();
        Book book = bookRepository.findByTenantIdAndBarcode(tenantId, barcode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Book", "barcode", barcode));
        return bookMapper.toResponse(book);
    }

    @Transactional
    public BookResponse createBook(CreateBookRequest request) {
        String tenantId = TenantContext.getTenantId();
        String barcode = request.barcode().trim();

        if (bookRepository.existsByTenantIdAndBarcode(tenantId, barcode)) {
            throw new DuplicateResourceException(
                    String.format("Book with barcode '%s' already exists for tenant '%s'", barcode, tenantId)
            );
        }

        Book book = bookMapper.toEntity(request, tenantId);
        Book savedBook = bookRepository.save(book);
        return bookMapper.toResponse(savedBook);
    }

    @Transactional
    public BookResponse updateBook(String barcode, UpdateBookRequest request) {
        String tenantId = TenantContext.getTenantId();
        Book book = bookRepository.findByTenantIdAndBarcode(tenantId, barcode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Book", "barcode", barcode));

        bookMapper.updateEntity(book, request);
        Book updatedBook = bookRepository.save(book);
        return bookMapper.toResponse(updatedBook);
    }

    @Transactional
    public void deleteBook(String barcode) {
        String tenantId = TenantContext.getTenantId();
        Book book = bookRepository.findByTenantIdAndBarcode(tenantId, barcode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Book", "barcode", barcode));

        bookRepository.delete(book);
    }

    @Transactional
    public BulkDeleteResponse bulkDelete(BulkDeleteRequest request) {
        String tenantId = TenantContext.getTenantId();
        List<String> barcodes = request.barcodes().stream()
                .filter(b -> b != null && !b.isBlank())
                .map(String::trim)
                .distinct()
                .toList();

        if (barcodes.isEmpty()) {
            return new BulkDeleteResponse(0, 0, "No barcodes provided for bulk deletion");
        }

        int deletedCount = bookRepository.deleteByTenantIdAndBarcodeIn(tenantId, barcodes);

        return new BulkDeleteResponse(
                barcodes.size(),
                deletedCount,
                String.format("Successfully deleted %d of %d requested books", deletedCount, barcodes.size())
        );
    }
}

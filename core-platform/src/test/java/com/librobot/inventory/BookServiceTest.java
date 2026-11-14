package com.librobot.inventory;

import com.librobot.common.DuplicateResourceException;
import com.librobot.common.ResourceNotFoundException;
import com.librobot.common.TenantContext;
import com.librobot.inventory.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock
    private BookRepository bookRepository;

    @Spy
    private BookMapper bookMapper = new BookMapper();

    @InjectMocks
    private BookService bookService;

    @BeforeEach
    void setUp() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("createBook successfully saves and returns book response")
    void createBook_Success() {
        CreateBookRequest request = new CreateBookRequest(
                "9780134685991",
                "Effective Java",
                "Joshua Bloch",
                "Computer Science",
                BookStatus.AVAILABLE,
                "SHELF-CS-01"
        );

        when(bookRepository.existsByTenantIdAndBarcode("default-tenant", "9780134685991"))
                .thenReturn(false);

        Book savedEntity = new Book(
                "default-tenant",
                "9780134685991",
                "Effective Java",
                "Joshua Bloch",
                "Computer Science",
                BookStatus.AVAILABLE,
                "SHELF-CS-01"
        );
        savedEntity.setId(1L);

        when(bookRepository.save(any(Book.class))).thenReturn(savedEntity);

        BookResponse response = bookService.createBook(request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.barcode()).isEqualTo("9780134685991");
        assertThat(response.title()).isEqualTo("Effective Java");
        assertThat(response.author()).isEqualTo("Joshua Bloch");

        verify(bookRepository).existsByTenantIdAndBarcode("default-tenant", "9780134685991");
        verify(bookRepository).save(any(Book.class));
    }

    @Test
    @DisplayName("createBook with duplicate barcode throws DuplicateResourceException (409)")
    void createBook_DuplicateBarcode_ThrowsConflict() {
        CreateBookRequest request = new CreateBookRequest(
                "9780134685991",
                "Effective Java",
                "Joshua Bloch",
                "Computer Science",
                BookStatus.AVAILABLE,
                "SHELF-CS-01"
        );

        when(bookRepository.existsByTenantIdAndBarcode("default-tenant", "9780134685991"))
                .thenReturn(true);

        assertThatThrownBy(() -> bookService.createBook(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("9780134685991");

        verify(bookRepository).existsByTenantIdAndBarcode("default-tenant", "9780134685991");
        verify(bookRepository, never()).save(any());
    }

    @Test
    @DisplayName("getBookByBarcode successfully returns matching book")
    void getBookByBarcode_Success() {
        Book book = new Book("default-tenant", "9780134685991", "Effective Java", "Joshua Bloch", "CS", BookStatus.AVAILABLE, "S1");
        book.setId(10L);

        when(bookRepository.findByTenantIdAndBarcode("default-tenant", "9780134685991"))
                .thenReturn(Optional.of(book));

        BookResponse response = bookService.getBookByBarcode("9780134685991");

        assertThat(response).isNotNull();
        assertThat(response.barcode()).isEqualTo("9780134685991");
        assertThat(response.title()).isEqualTo("Effective Java");
    }

    @Test
    @DisplayName("getBookByBarcode with unknown barcode throws ResourceNotFoundException (404)")
    void getBookByBarcode_NotFound_ThrowsException() {
        when(bookRepository.findByTenantIdAndBarcode("default-tenant", "UNKNOWN"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookService.getBookByBarcode("UNKNOWN"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("UNKNOWN");
    }

    @Test
    @DisplayName("updateBook successfully updates fields and saves entity")
    void updateBook_Success() {
        Book existing = new Book("default-tenant", "9780134685991", "Old Title", "Author", "CS", BookStatus.AVAILABLE, "S1");
        existing.setId(5L);

        when(bookRepository.findByTenantIdAndBarcode("default-tenant", "9780134685991"))
                .thenReturn(Optional.of(existing));
        when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateBookRequest updateRequest = new UpdateBookRequest("Updated Title", "New Author", "Math", BookStatus.ISSUED, "S2");

        BookResponse response = bookService.updateBook("9780134685991", updateRequest);

        assertThat(response.title()).isEqualTo("Updated Title");
        assertThat(response.author()).isEqualTo("New Author");
        assertThat(response.department()).isEqualTo("Math");
        assertThat(response.status()).isEqualTo(BookStatus.ISSUED);
        assertThat(response.shelfCode()).isEqualTo("S2");
    }

    @Test
    @DisplayName("deleteBook successfully removes existing book")
    void deleteBook_Success() {
        Book book = new Book("default-tenant", "9780134685991", "Effective Java", "Joshua Bloch", "CS", BookStatus.AVAILABLE, "S1");
        when(bookRepository.findByTenantIdAndBarcode("default-tenant", "9780134685991"))
                .thenReturn(Optional.of(book));

        bookService.deleteBook("9780134685991");

        verify(bookRepository).delete(book);
    }

    @Test
    @DisplayName("bulkDelete successfully deletes multiple barcodes atomically")
    void bulkDelete_Success() {
        BulkDeleteRequest request = new BulkDeleteRequest(List.of("BC-001", "BC-002", "BC-003"));

        when(bookRepository.deleteByTenantIdAndBarcodeIn(eq("default-tenant"), any()))
                .thenReturn(3);

        BulkDeleteResponse response = bookService.bulkDelete(request);

        assertThat(response.requestedCount()).isEqualTo(3);
        assertThat(response.deletedCount()).isEqualTo(3);
        assertThat(response.message()).contains("Successfully deleted 3 of 3 requested books");
    }

    @Test
    @DisplayName("getBooks returns filtered page of book responses")
    void getBooks_WithFilter() {
        Book book1 = new Book("default-tenant", "BC-001", "Java Basics", "Author A", "CS", BookStatus.AVAILABLE, "S1");
        book1.setId(1L);

        Page<Book> entityPage = new PageImpl<>(List.of(book1));
        when(bookRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(entityPage);

        Page<BookResponse> page = bookService.getBooks("Java", "CS", "S1", BookStatus.AVAILABLE, PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).barcode()).isEqualTo("BC-001");
    }
}

package com.librobot.inventory;

import com.librobot.inventory.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller exposing Book inventory management APIs under /api/v1/books.
 * Shields internal domain entities by accepting and returning immutable DTO records only.
 */
@RestController
@RequestMapping("/api/v1/books")
@Tag(name = "Books", description = "Operations for library book inventory management")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    @Operation(summary = "Search and filter books", description = "Supports text query on title/author, filtering by department, shelf code, and status, with pagination and sorting.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved books page")
    })
    public ResponseEntity<Page<BookResponse>> getBooks(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String shelfCode,
            @RequestParam(required = false) BookStatus status,
            @PageableDefault(size = 20, sort = "title", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<BookResponse> books = bookService.getBooks(query, department, shelfCode, status, pageable);
        return ResponseEntity.ok(books);
    }

    @GetMapping("/{barcode}")
    @Operation(summary = "Get book by barcode", description = "Retrieves details of a single book identified by its exact barcode.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Book found"),
            @ApiResponse(responseCode = "404", description = "Book not found")
    })
    public ResponseEntity<BookResponse> getBookByBarcode(@PathVariable String barcode) {
        BookResponse book = bookService.getBookByBarcode(barcode);
        return ResponseEntity.ok(book);
    }

    @PostMapping
    @Operation(summary = "Create a new book", description = "Adds a new book record to the inventory. Duplicate barcodes return 409 Conflict.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Book successfully created"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "409", description = "Book with barcode already exists")
    })
    public ResponseEntity<BookResponse> createBook(@Valid @RequestBody CreateBookRequest request) {
        BookResponse created = bookService.createBook(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{barcode}")
    @Operation(summary = "Update an existing book", description = "Updates title, author, department, status, or shelf code of an existing book.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Book successfully updated"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "404", description = "Book not found")
    })
    public ResponseEntity<BookResponse> updateBook(
            @PathVariable String barcode,
            @Valid @RequestBody UpdateBookRequest request
    ) {
        BookResponse updated = bookService.updateBook(barcode, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{barcode}")
    @Operation(summary = "Delete a book", description = "Deletes a book record identified by its barcode.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Book successfully deleted"),
            @ApiResponse(responseCode = "404", description = "Book not found")
    })
    public ResponseEntity<Void> deleteBook(@PathVariable String barcode) {
        bookService.deleteBook(barcode);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-delete")
    @Operation(summary = "Atomic bulk delete books", description = "Deletes all books matching the provided list of barcodes within a single transaction.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bulk deletion completed"),
            @ApiResponse(responseCode = "400", description = "Invalid or empty barcodes list")
    })
    public ResponseEntity<BulkDeleteResponse> bulkDelete(@Valid @RequestBody BulkDeleteRequest request) {
        BulkDeleteResponse response = bookService.bulkDelete(request);
        return ResponseEntity.ok(response);
    }
}

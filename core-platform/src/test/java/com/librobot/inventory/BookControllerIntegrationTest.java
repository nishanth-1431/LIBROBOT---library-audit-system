package com.librobot.inventory;

import com.librobot.common.TenantContext;
import com.librobot.inventory.dto.BulkDeleteRequest;
import com.librobot.inventory.dto.CreateBookRequest;
import com.librobot.inventory.dto.UpdateBookRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end integration tests for BookController REST APIs.
 * Connects to a real MySQL 8.0 Testcontainer via Spring Boot's @ServiceConnection,
 * automatically executes Flyway V1-V6 migrations, and tests HTTP contracts and RFC 7807 payloads.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
class BookControllerIntegrationTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("librobot_integration")
            .withUsername("testuser")
            .withPassword("testpass");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void cleanUp() {
        TenantContext.clear();
        bookRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/v1/books successfully creates a book and returns 201 Created")
    void createBook_Success() throws Exception {
        CreateBookRequest request = new CreateBookRequest(
                "9780134685991",
                "Effective Java 3rd Edition",
                "Joshua Bloch",
                "Computer Science",
                BookStatus.AVAILABLE,
                "SHELF-CS-01"
        );

        mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.barcode", is("9780134685991")))
                .andExpect(jsonPath("$.title", is("Effective Java 3rd Edition")))
                .andExpect(jsonPath("$.author", is("Joshua Bloch")))
                .andExpect(jsonPath("$.status", is("AVAILABLE")))
                .andExpect(jsonPath("$.shelfCode", is("SHELF-CS-01")));
    }

    @Test
    @DisplayName("POST /api/v1/books with duplicate barcode returns 409 Conflict with RFC 7807 Problem Details")
    void createBook_DuplicateBarcode_Returns409Conflict() throws Exception {
        CreateBookRequest request = new CreateBookRequest(
                "9780134685991",
                "Effective Java",
                "Joshua Bloch",
                "Computer Science",
                BookStatus.AVAILABLE,
                "SHELF-CS-01"
        );

        // First creation succeeds
        mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Duplicate creation returns 409 Conflict
        mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title", is("Conflict")))
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.detail", containsString("9780134685991")))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/v1/books with invalid blank fields returns 400 Bad Request with field errors")
    void createBook_InvalidFields_Returns400BadRequest() throws Exception {
        CreateBookRequest request = new CreateBookRequest("", "", "Author", "Dept", BookStatus.AVAILABLE, "S1");

        mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title", is("Validation Failed")))
                .andExpect(jsonPath("$.errors.barcode", is("Barcode is required")))
                .andExpect(jsonPath("$.errors.title", is("Title is required")))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/v1/books/{barcode} returns 200 OK with book details")
    void getBookByBarcode_Success() throws Exception {
        CreateBookRequest create = new CreateBookRequest("BC-1001", "Clean Architecture", "Robert C. Martin", "CS", BookStatus.AVAILABLE, "S1");
        mockMvc.perform(post("/api/v1/books").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/books/BC-1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.barcode", is("BC-1001")))
                .andExpect(jsonPath("$.title", is("Clean Architecture")));
    }

    @Test
    @DisplayName("GET /api/v1/books/{barcode} for non-existent barcode returns 404 Not Found Problem Details")
    void getBookByBarcode_NotFound_Returns404() throws Exception {
        mockMvc.perform(get("/api/v1/books/NONEXISTENT"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title", is("Resource Not Found")))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.detail", containsString("NONEXISTENT")))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("PUT /api/v1/books/{barcode} updates book and returns 200 OK")
    void updateBook_Success() throws Exception {
        CreateBookRequest create = new CreateBookRequest("BC-2002", "Refactoring", "Martin Fowler", "CS", BookStatus.AVAILABLE, "S1");
        mockMvc.perform(post("/api/v1/books").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated());

        UpdateBookRequest update = new UpdateBookRequest("Refactoring 2nd Ed", "Martin Fowler & Kent Beck", "Software Eng", BookStatus.ISSUED, "SHELF-SE-02");
        mockMvc.perform(put("/api/v1/books/BC-2002")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Refactoring 2nd Ed")))
                .andExpect(jsonPath("$.author", is("Martin Fowler & Kent Beck")))
                .andExpect(jsonPath("$.status", is("ISSUED")))
                .andExpect(jsonPath("$.shelfCode", is("SHELF-SE-02")));
    }

    @Test
    @DisplayName("DELETE /api/v1/books/{barcode} removes book and returns 204 No Content")
    void deleteBook_Success() throws Exception {
        CreateBookRequest create = new CreateBookRequest("BC-3003", "Domain-Driven Design", "Eric Evans", "CS", BookStatus.AVAILABLE, "S1");
        mockMvc.perform(post("/api/v1/books").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/v1/books/BC-3003"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/books/BC-3003"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/v1/books/bulk-delete deletes matching barcodes atomically")
    void bulkDelete_Success() throws Exception {
        mockMvc.perform(post("/api/v1/books").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateBookRequest("BD-01", "Book 1", "A1", "D1", BookStatus.AVAILABLE, "S1")))).andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/books").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateBookRequest("BD-02", "Book 2", "A2", "D1", BookStatus.AVAILABLE, "S1")))).andExpect(status().isCreated());

        BulkDeleteRequest bulkRequest = new BulkDeleteRequest(List.of("BD-01", "BD-02"));

        mockMvc.perform(post("/api/v1/books/bulk-delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bulkRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedCount", is(2)))
                .andExpect(jsonPath("$.deletedCount", is(2)));

        mockMvc.perform(get("/api/v1/books/BD-01")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/books/BD-02")).andExpect(status().isNotFound());
    }
}

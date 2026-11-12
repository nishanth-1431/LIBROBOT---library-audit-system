package com.librobot.inventory.dto;

import com.librobot.inventory.BookStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateBookRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 512, message = "Title must not exceed 512 characters")
        String title,

        @Size(max = 255, message = "Author must not exceed 255 characters")
        String author,

        @Size(max = 128, message = "Department must not exceed 128 characters")
        String department,

        BookStatus status,

        @Size(max = 64, message = "Shelf code must not exceed 64 characters")
        String shelfCode
) {}

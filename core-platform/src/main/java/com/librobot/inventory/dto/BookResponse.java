package com.librobot.inventory.dto;

import com.librobot.inventory.BookStatus;

import java.time.Instant;

/**
 * Immutable DTO record representing book details in API responses.
 * Strictly shields the underlying JPA entity from external serialization.
 */
public record BookResponse(
        Long id,
        String barcode,
        String title,
        String author,
        String department,
        BookStatus status,
        String shelfCode,
        Instant createdAt,
        Instant updatedAt
) {}

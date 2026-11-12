package com.librobot.inventory.dto;

public record BulkDeleteResponse(
        int requestedCount,
        int deletedCount,
        String message
) {}

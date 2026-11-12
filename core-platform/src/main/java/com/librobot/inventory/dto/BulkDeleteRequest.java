package com.librobot.inventory.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record BulkDeleteRequest(
        @NotNull(message = "Barcodes list must not be null")
        @NotEmpty(message = "Barcodes list must not be empty")
        List<String> barcodes
) {}

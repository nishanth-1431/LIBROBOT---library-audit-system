package com.librobot.common;

/**
 * Thread-local context holder for the current tenant ID.
 * Defaults to "default-tenant" for single-tenant Phase 1-6 operation.
 * Designed as a clean abstraction so Phase 7 multi-tenancy can dynamically
 * resolve tenant IDs from JWT tokens or API keys without changing repository calls.
 */
public final class TenantContext {

    public static final String DEFAULT_TENANT_ID = "default-tenant";

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {}

    public static String getTenantId() {
        String tenantId = CURRENT_TENANT.get();
        return (tenantId != null && !tenantId.isBlank()) ? tenantId : DEFAULT_TENANT_ID;
    }

    public static void setTenantId(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}

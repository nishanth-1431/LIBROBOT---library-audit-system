package com.librobot;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.flyway.enabled=true"
})
@Testcontainers
class SchemaValidationTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("librobot_test")
            .withUsername("testuser")
            .withPassword("testpass");

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Should apply all Flyway migrations and pass Hibernate schema validation")
    void shouldApplyMigrationsAndPassHibernateValidation() {
        // Verify Flyway successfully applied all versioned migrations (V1 through V6)
        Integer migrationCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM flyway_schema_history WHERE success = 1",
                Integer.class
        );
        assertThat(migrationCount).isNotNull().isGreaterThanOrEqualTo(6);

        // Verify default tenant seed from V1 is present
        Integer tenantCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM tenants WHERE id = 'default-tenant'",
                Integer.class
        );
        assertThat(tenantCount).isEqualTo(1);

        // Verify all 6 core tables exist in the relational database
        Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'librobot_test' AND table_name IN ('tenants', 'shelves', 'books', 'audit_sessions', 'scan_events', 'import_jobs')",
                Integer.class
        );
        assertThat(tableCount).isEqualTo(6);
    }
}

package com.librobot.inventory;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Specifications for dynamic filtering of Book entities.
 * Enforces mandatory tenant isolation on every single query predicate.
 */
public final class BookSpecifications {

    private BookSpecifications() {}

    public static Specification<Book> withFilter(
            String tenantId,
            String query,
            String department,
            String shelfCode,
            BookStatus status
    ) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Mandatory tenant isolation filter
            predicates.add(cb.equal(root.get("tenantId"), tenantId));

            // 2. Case-insensitive search on title or author
            if (query != null && !query.trim().isBlank()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate authorMatch = cb.like(cb.lower(root.get("author")), pattern);
                predicates.add(cb.or(titleMatch, authorMatch));
            }

            // 3. Department filter
            if (department != null && !department.trim().isBlank()) {
                predicates.add(cb.equal(root.get("department"), department.trim()));
            }

            // 4. Shelf code filter
            if (shelfCode != null && !shelfCode.trim().isBlank()) {
                predicates.add(cb.equal(root.get("shelfCode"), shelfCode.trim()));
            }

            // 5. Status filter
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

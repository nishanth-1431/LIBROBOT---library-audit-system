package com.librobot.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Book entities.
 * Every query strictly enforces tenant scoping via tenantId parameter.
 */
@Repository
public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {

    Optional<Book> findByTenantIdAndBarcode(String tenantId, String barcode);

    boolean existsByTenantIdAndBarcode(String tenantId, String barcode);

    List<Book> findAllByTenantIdAndBarcodeIn(String tenantId, Collection<String> barcodes);

    @Modifying
    @Query("DELETE FROM Book b WHERE b.tenantId = :tenantId AND b.barcode = :barcode")
    int deleteByTenantIdAndBarcode(@Param("tenantId") String tenantId, @Param("barcode") String barcode);

    @Modifying
    @Query("DELETE FROM Book b WHERE b.tenantId = :tenantId AND b.barcode IN :barcodes")
    int deleteByTenantIdAndBarcodeIn(@Param("tenantId") String tenantId, @Param("barcodes") Collection<String> barcodes);

    long countByTenantId(String tenantId);
}

package com.tradelect.order.repository;

import com.tradelect.order.model.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    Page<Purchase> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}

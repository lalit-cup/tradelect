package com.tradelect.order.repository;

import com.tradelect.order.model.WishlistItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {
    Page<WishlistItem> findByUserId(Long userId, Pageable pageable);
    Optional<WishlistItem> findByIdAndUserId(Long id, Long userId);
    // findAll(Pageable) inherited from JpaRepository
}

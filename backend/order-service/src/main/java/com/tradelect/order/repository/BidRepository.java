package com.tradelect.order.repository;
import com.tradelect.order.model.Bid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface BidRepository extends JpaRepository<Bid, Long> {
    Page<Bid> findByUserId(Long userId, Pageable pageable);
    Optional<Bid> findByIdAndUserId(Long id, Long userId);
    Page<Bid> findAll(Pageable pageable);
}

package com.tradelect.order.repository;
import com.tradelect.order.model.Enquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {
    Page<Enquiry> findByUserId(Long userId, Pageable pageable);
    Optional<Enquiry> findByIdAndUserId(Long id, Long userId);
}

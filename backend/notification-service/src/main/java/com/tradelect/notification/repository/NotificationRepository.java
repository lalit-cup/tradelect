package com.tradelect.notification.repository;

import com.tradelect.notification.model.Notification;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndRead(Long userId, boolean read);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    /** Bulk mark all unread as read — single UPDATE instead of N saves */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.userId = :userId AND n.read = false")
    int markAllReadByUserId(@Param("userId") Long userId);
}

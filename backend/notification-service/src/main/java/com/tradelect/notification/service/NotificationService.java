package com.tradelect.notification.service;

import com.tradelect.notification.model.Notification;
import com.tradelect.notification.model.NotificationType;
import com.tradelect.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository repo;

    public Page<Notification> getUserNotifications(Long userId, int page, int size) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
    }

    public long getUnreadCount(Long userId) {
        return repo.countByUserIdAndRead(userId, false);
    }

    @Transactional
    public void markAllRead(Long userId) {
        int updated = repo.markAllReadByUserId(userId);
        log.debug("Marked {} notifications as read for user {}", updated, userId);
    }

    @Transactional
    public void markRead(Long id, Long userId) {
        repo.findByIdAndUserId(id, userId).ifPresent(n -> { n.setRead(true); repo.save(n); });
    }

    @Transactional
    public void sendNotification(Long userId, String title, String message, NotificationType type) {
        Notification n = Notification.builder()
                .userId(userId).title(title).message(message).type(type).build();
        repo.save(n);
        log.info("Notification → user={} type={} title={}", userId, type, title);
    }

    // ── Kafka: bid updated ────────────────────────────────────────────────────
    @KafkaListener(topics = "bid-events", groupId = "notification-service",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onBidEvent(@Payload Map<String, Object> event) {
        try {
            Long userId      = toLong(event.get("userId"));
            String product   = str(event.getOrDefault("productName", "your product"));
            String status    = str(event.getOrDefault("status", "UPDATED")).toLowerCase();
            sendNotification(userId,
                "Bid " + capitalize(status),
                "Your bid for \"" + product + "\" has been " + status + ".",
                NotificationType.BID_UPDATE);
        } catch (Exception e) {
            log.error("bid-event error: {} | {}", e.getMessage(), event);
        }
    }

    // ── Kafka: enquiry replied ─────────────────────────────────────────────────
    @KafkaListener(topics = "enquiry-events", groupId = "notification-service",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onEnquiryEvent(@Payload Map<String, Object> event) {
        try {
            Long userId    = toLong(event.get("userId"));
            String subject = str(event.getOrDefault("subject", "your enquiry"));
            sendNotification(userId,
                "Enquiry Reply",
                "You received a reply to your enquiry: \"" + subject + "\".",
                NotificationType.ENQUIRY_REPLY);
        } catch (Exception e) {
            log.error("enquiry-event error: {} | {}", e.getMessage(), event);
        }
    }

    // ── Kafka: new product added — notify all customers ───────────────────────
    @KafkaListener(topics = "product-created-events", groupId = "notification-service",
                   containerFactory = "kafkaListenerContainerFactory")
    @Transactional
    public void onProductCreated(@Payload Map<String, Object> event) {
        try {
            String productName = str(event.getOrDefault("productName", "a new product"));
            String brand       = str(event.getOrDefault("brand", ""));
            String category    = str(event.getOrDefault("category", ""));
            String price       = str(event.getOrDefault("price", ""));

            @SuppressWarnings("unchecked")
            List<Object> userIds = (List<Object>) event.get("userIds");
            if (userIds == null || userIds.isEmpty()) {
                log.info("product-created-events: no customer IDs in payload");
                return;
            }

            String title = "🔌 New Product: " + productName;
            String msg   = "A new product has been listed"
                         + (brand.isEmpty() ? "" : " by " + brand)
                         + (category.isEmpty() ? "" : " in " + category)
                         + (price.isEmpty() ? "" : " — ₹" + price)
                         + ". Tap to view and order!";

            // Batch-save all notifications
            List<Notification> notifications = userIds.stream()
                .map(id -> Notification.builder()
                    .userId(toLong(id))
                    .title(title).message(msg)
                    .type(NotificationType.PRODUCT_ALERT)
                    .build())
                .toList();

            repo.saveAll(notifications);
            log.info("product-created notifications saved for {} customers, product={}",
                    notifications.size(), productName);
        } catch (Exception e) {
            log.error("product-created-events error: {} | {}", e.getMessage(), event);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Long toLong(Object val) {
        if (val == null) throw new IllegalArgumentException("userId is null");
        return Long.valueOf(val.toString());
    }
    private String str(Object val) { return val == null ? "" : val.toString(); }
    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
    }

    // ── Kafka: order placed / status updated ─────────────────────────────────
    @KafkaListener(topics = "order-events", groupId = "notification-service",
                   containerFactory = "kafkaListenerContainerFactory")
    public void onOrderEvent(@Payload Map<String, Object> event) {
        try {
            Long userId      = toLong(event.get("userId"));
            String product   = str(event.getOrDefault("productName", "your product"));
            String status    = str(event.getOrDefault("status", "PENDING"));
            String orderId   = str(event.getOrDefault("orderId", ""));
            String amount    = str(event.getOrDefault("totalAmount", ""));

            String title, msg;
            if ("PENDING".equals(status)) {
                title = "🛒 Order Placed — #" + orderId;
                msg   = "Your order for " + product + ""
                      + (amount.isEmpty() ? "" : " (₹" + amount + ")")
                      + " has been placed and is pending confirmation.";
            } else {
                title = "📦 Order " + capitalize(status) + " — #" + orderId;
                msg   = "Your order for " + product + " is now " + status.toLowerCase() + ".";
            }
            sendNotification(userId, title, msg, NotificationType.ORDER_UPDATE);
        } catch (Exception e) {
            log.error("order-event error: {} | {}", e.getMessage(), event);
        }
    }

}

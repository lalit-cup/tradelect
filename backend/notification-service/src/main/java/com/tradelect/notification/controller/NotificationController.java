package com.tradelect.notification.controller;

import com.tradelect.notification.model.Notification;
import com.tradelect.notification.model.NotificationType;
import com.tradelect.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Notification> notifs = service.getUserNotifications(userId, page, size);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("data", notifs.getContent());
        resp.put("totalElements", notifs.getTotalElements());
        resp.put("totalPages", notifs.getTotalPages());
        resp.put("unreadCount", service.getUnreadCount(userId));
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllRead(
            @RequestHeader("X-User-Id") Long userId) {
        service.markAllRead(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "All notifications marked as read"));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markRead(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        service.markRead(id, userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendNotification(
            @RequestBody Map<String, String> body) {
        try {
            Long userId = Long.parseLong(body.get("userId"));
            String title   = body.getOrDefault("title", "Notification");
            String message = body.getOrDefault("message", "");
            String typeStr = body.getOrDefault("type", "SYSTEM");
            NotificationType type;
            try { type = NotificationType.valueOf(typeStr); }
            catch (Exception e) { type = NotificationType.SYSTEM; }
            service.sendNotification(userId, title, message, type);
            return ResponseEntity.ok(Map.of("success", true, "message", "Notification sent"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", "Invalid request: " + e.getMessage()));
        }
    }
}

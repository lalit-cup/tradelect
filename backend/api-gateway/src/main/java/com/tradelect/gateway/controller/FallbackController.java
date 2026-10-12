package com.tradelect.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @RequestMapping("/auth")
    public ResponseEntity<Map<String,Object>> authFallback() {
        return fallback("auth-service");
    }

    @RequestMapping("/product")
    public ResponseEntity<Map<String,Object>> productFallback() {
        return fallback("product-service");
    }

    @RequestMapping("/order")
    public ResponseEntity<Map<String,Object>> orderFallback() {
        return fallback("order-service");
    }

    @RequestMapping("/notification")
    public ResponseEntity<Map<String,Object>> notificationFallback() {
        return fallback("notification-service");
    }

    @RequestMapping("/user")
    public ResponseEntity<Map<String,Object>> userFallback() {
        return fallback("user-service");
    }

    private ResponseEntity<Map<String,Object>> fallback(String service) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                "success", false,
                "message", service + " is temporarily unavailable. Please try again shortly.",
                "timestamp", LocalDateTime.now().toString(),
                "service", service
            ));
    }
}

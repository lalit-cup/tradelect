package com.tradelect.order.controller;

import com.tradelect.order.dto.*;
import com.tradelect.order.model.PurchaseStatus;
import com.tradelect.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ── Wishlist — CUSTOMER only ──────────────────────────────────────────────

    @PostMapping("/wishlist")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String,Object>> addToWishlist(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody WishlistRequest request) {
        var item = orderService.addToWishlist(userId, request);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true); r.put("message", "Added to wishlist"); r.put("data", item);
        return ResponseEntity.status(HttpStatus.CREATED).body(r);
    }

    @GetMapping("/wishlist")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String,Object>> getWishlist(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<WishlistDto> items = orderService.getWishlist(userId, page, size);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true); r.put("data", items.getContent());
        r.put("totalElements", items.getTotalElements()); r.put("totalPages", items.getTotalPages());
        return ResponseEntity.ok(r);
    }

    @PutMapping("/wishlist/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String,Object>> updateWishlistItem(
            @PathVariable Long id, @RequestHeader("X-User-Id") Long userId,
            @RequestBody WishlistRequest request) {
        var item = orderService.updateWishlistItem(id, userId, request);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true); r.put("data", item);
        return ResponseEntity.ok(r);
    }

    @DeleteMapping("/wishlist/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String,Object>> removeFromWishlist(
            @PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        orderService.removeFromWishlist(id, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Removed from wishlist"));
    }

    // ── Bids — DEALER only ────────────────────────────────────────────────────

    @PostMapping("/bids")
    @PreAuthorize("hasRole('DEALER')")
    public ResponseEntity<Map<String,Object>> placeBid(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "DEALER") String userRole,
            @Valid @RequestBody BidRequest request) {
        var bid = orderService.placeBid(userId, userRole, request);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true); r.put("message", "Bid submitted successfully"); r.put("data", bid);
        return ResponseEntity.status(HttpStatus.CREATED).body(r);
    }

    @GetMapping("/bids")
    @PreAuthorize("hasAnyRole('DEALER','ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> getMyBids(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<BidDto> bids = orderService.getUserBids(userId, page, size);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true); r.put("data", bids.getContent());
        r.put("totalElements", bids.getTotalElements()); r.put("totalPages", bids.getTotalPages());
        return ResponseEntity.ok(r);
    }

    @DeleteMapping("/bids/{id}")
    @PreAuthorize("hasRole('DEALER')")
    public ResponseEntity<Map<String,Object>> cancelBid(
            @PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        orderService.cancelBid(id, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Bid cancelled"));
    }

    // ── Enquiries — CUSTOMER and DEALER ──────────────────────────────────────

    @PostMapping("/enquiries")
    @PreAuthorize("hasAnyRole('CUSTOMER','DEALER')")
    public ResponseEntity<Map<String,Object>> postEnquiry(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody EnquiryRequest request) {
        var enquiry = orderService.postEnquiry(userId, request);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true); r.put("message", "Enquiry submitted"); r.put("data", enquiry);
        return ResponseEntity.status(HttpStatus.CREATED).body(r);
    }

    @GetMapping("/enquiries")
    @PreAuthorize("hasAnyRole('CUSTOMER','DEALER')")
    public ResponseEntity<Map<String,Object>> getMyEnquiries(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<EnquiryDto> enquiries = orderService.getUserEnquiries(userId, page, size);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true); r.put("data", enquiries.getContent());
        r.put("totalElements", enquiries.getTotalElements()); r.put("totalPages", enquiries.getTotalPages());
        return ResponseEntity.ok(r);
    }

    @PutMapping("/enquiries/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER','DEALER')")
    public ResponseEntity<Map<String,Object>> updateEnquiry(
            @PathVariable Long id, @RequestHeader("X-User-Id") Long userId,
            @RequestBody EnquiryRequest request) {
        var enquiry = orderService.updateEnquiry(id, userId, request);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true); r.put("data", enquiry);
        return ResponseEntity.ok(r);
    }

    @DeleteMapping("/enquiries/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER','DEALER')")
    public ResponseEntity<Map<String,Object>> deleteEnquiry(
            @PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        orderService.deleteEnquiry(id, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Enquiry deleted"));
    }

    // ── Purchases — CUSTOMER only ─────────────────────────────────────────────

    @PostMapping("/purchases")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String,Object>> buyProduct(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody PurchaseRequest request) {
        var purchase = orderService.createPurchase(userId, request);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true);
        r.put("message", "Purchase order placed successfully! Order ID: " + purchase.getId());
        r.put("data", purchase);
        return ResponseEntity.status(HttpStatus.CREATED).body(r);
    }

    @GetMapping("/purchases")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String,Object>> getMyPurchases(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var purchases = orderService.getMyPurchases(userId, page, size);
        Map<String,Object> r = new HashMap<>();
        r.put("success", true); r.put("data", purchases.getContent());
        r.put("totalElements", purchases.getTotalElements()); r.put("totalPages", purchases.getTotalPages());
        return ResponseEntity.ok(r);
    }

    @DeleteMapping("/purchases/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String,Object>> cancelPurchase(
            @PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        orderService.cancelPurchase(id, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Purchase cancelled"));
    }

}

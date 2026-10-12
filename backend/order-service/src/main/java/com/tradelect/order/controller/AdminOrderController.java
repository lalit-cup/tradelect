package com.tradelect.order.controller;

import com.tradelect.order.model.*;
import com.tradelect.order.repository.*;
import com.tradelect.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','DEALER')")
public class AdminOrderController {

    private final OrderService orderService;
    private final BidRepository bidRepo;
    private final EnquiryRepository enquiryRepo;
    private final WishlistRepository wishlistRepo;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @GetMapping("/bids")
    public ResponseEntity<Map<String,Object>> getAllBids(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Bid> bids = bidRepo.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(Map.of("success", true, "data", bids.getContent(),
            "totalElements", bids.getTotalElements(), "totalPages", bids.getTotalPages()));
    }

    @PutMapping("/bids/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> updateBidStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String response) {
        Bid bid = bidRepo.findById(id).orElseThrow(() -> new RuntimeException("Bid not found"));
        bid.setStatus(BidStatus.valueOf(status.toUpperCase()));
        if (response != null) bid.setAdminResponse(response);
        bidRepo.save(bid);
        // Send notification to user
        try {
            kafkaTemplate.send("bid-events", Map.of(
                "userId", bid.getUserId().toString(),
                "bidId", bid.getId().toString(),
                "status", status.toUpperCase(),
                "productName", bid.getProductName() != null ? bid.getProductName() : ""
            ));
        } catch (Exception e) {
            // Kafka may not be available — log but don't fail
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Bid status updated"));
    }

    @GetMapping("/enquiries")
    public ResponseEntity<Map<String,Object>> getAllEnquiries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Enquiry> enquiries = enquiryRepo.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(Map.of("success", true, "data", enquiries.getContent(),
            "totalElements", enquiries.getTotalElements(), "totalPages", enquiries.getTotalPages()));
    }

    @PutMapping("/enquiries/{id}/reply")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> replyToEnquiry(
            @PathVariable Long id,
            @RequestParam String reply) {
        Enquiry e = enquiryRepo.findById(id).orElseThrow(() -> new RuntimeException("Enquiry not found"));
        e.setAdminReply(reply);
        e.setStatus(EnquiryStatus.RESOLVED);
        enquiryRepo.save(e);
        // Send notification to user
        try {
            kafkaTemplate.send("enquiry-events", Map.of(
                "userId", e.getUserId().toString(),
                "enquiryId", e.getId().toString(),
                "subject", e.getSubject() != null ? e.getSubject() : ""
            ));
        } catch (Exception ex) {
            // Kafka may not be available — log but don't fail
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Reply sent"));
    }

    @GetMapping("/wishlists")
    public ResponseEntity<Map<String,Object>> getAllWishlists(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<WishlistItem> items = wishlistRepo.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(Map.of("success", true, "data", items.getContent(),
            "totalElements", items.getTotalElements(), "totalPages", items.getTotalPages()));
    }

    @GetMapping("/purchases")
    public ResponseEntity<Map<String,Object>> getAllPurchases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var purchases = orderService.getAllPurchases(page, size);
        return ResponseEntity.ok(Map.of("success", true, "data", purchases.getContent(),
            "totalElements", purchases.getTotalElements(), "totalPages", purchases.getTotalPages()));
    }

    @PutMapping("/purchases/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> updatePurchaseStatus(
            @PathVariable Long id, @RequestParam String status) {
        var updated = orderService.updatePurchaseStatus(id, status);
        // Notify customer of status change
        try {
            kafkaTemplate.send("order-events", Map.of(
                "userId",      updated.getUserId().toString(),
                "orderId",     updated.getId().toString(),
                "productName", updated.getProductName() != null ? updated.getProductName() : "",
                "totalAmount", updated.getTotalAmount() != null ? updated.getTotalAmount().toPlainString() : "",
                "status",      status.toUpperCase()
            ));
        } catch (Exception e) { /* non-critical */ }
        return ResponseEntity.ok(Map.of("success", true, "data", updated));
    }


    @PutMapping("/purchases/{id}/delivery")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Map<String,Object>> updateDeliveryInfo(
            @PathVariable Long id,
            @RequestParam(required = false) String deliveryPartner,
            @RequestParam(required = false) String trackingNumber) {
        var updated = orderService.updateDeliveryInfo(id, deliveryPartner, trackingNumber);
        // Notify customer if tracking assigned
        if (trackingNumber != null && !trackingNumber.isBlank()) {
            try {
                kafkaTemplate.send("order-events", Map.of(
                    "userId",      updated.getUserId().toString(),
                    "orderId",     updated.getId().toString(),
                    "productName", updated.getProductName() != null ? updated.getProductName() : "",
                    "totalAmount", updated.getTotalAmount() != null ? updated.getTotalAmount().toPlainString() : "",
                    "status",      "SHIPPED",
                    "trackingNumber", trackingNumber,
                    "deliveryPartner", deliveryPartner != null ? deliveryPartner : ""
                ));
            } catch (Exception e) { /* non-critical */ }
        }
        return ResponseEntity.ok(Map.of("success", true, "data", updated,
            "message", "Delivery info updated" + (trackingNumber != null ? " — Order auto-advanced to SHIPPED" : "")));
    }

}

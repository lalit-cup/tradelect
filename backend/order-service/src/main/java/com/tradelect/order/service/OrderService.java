package com.tradelect.order.service;

import com.tradelect.order.dto.*;
import com.tradelect.order.model.*;
import com.tradelect.order.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final WishlistRepository wishlistRepo;
    private final PurchaseRepository purchaseRepo;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final BidRepository bidRepo;
    private final EnquiryRepository enquiryRepo;

    // ---- WISHLIST ----
    @Transactional
    public WishlistDto addToWishlist(Long userId, WishlistRequest req) {
        WishlistItem item = WishlistItem.builder()
                .userId(userId).productId(req.getProductId())
                .productName(req.getProductName()).partNumber(req.getPartNumber())
                .brand(req.getBrand()).quantity(req.getQuantity())
                .notes(req.getNotes()).deliveryAddress(req.getDeliveryAddress())
                .contactPerson(req.getContactPerson()).contactPhone(req.getContactPhone())
                .status(WishlistStatus.PENDING).build();
        return toWishlistDto(wishlistRepo.save(item));
    }

    public Page<WishlistDto> getWishlist(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return wishlistRepo.findByUserId(userId, pageable).map(this::toWishlistDto);
    }

    @Transactional
    public WishlistDto updateWishlistItem(Long id, Long userId, WishlistRequest req) {
        WishlistItem item = wishlistRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Wishlist item not found"));
        item.setQuantity(req.getQuantity());
        item.setNotes(req.getNotes());
        item.setDeliveryAddress(req.getDeliveryAddress());
        item.setContactPerson(req.getContactPerson());
        item.setContactPhone(req.getContactPhone());
        return toWishlistDto(wishlistRepo.save(item));
    }

    @Transactional
    public void removeFromWishlist(Long id, Long userId) {
        WishlistItem item = wishlistRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Wishlist item not found"));
        wishlistRepo.delete(item);
    }

    // ---- BIDS ----
    @Transactional
    public BidDto placeBid(Long userId, String role, BidRequest req) {
        BidderType type = "DEALER".equalsIgnoreCase(role) ? BidderType.DEALER : BidderType.CUSTOMER;
        Bid bid = Bid.builder()
                .userId(userId).productId(req.getProductId())
                .productName(req.getProductName()).partNumber(req.getPartNumber())
                .offerPrice(req.getOfferPrice()).quantity(req.getQuantity())
                .message(req.getMessage()).deliveryAddress(req.getDeliveryAddress())
                .contactPerson(req.getContactPerson()).contactPhone(req.getContactPhone())
                .bidderType(type).status(BidStatus.PENDING).build();
        return toBidDto(bidRepo.save(bid));
    }

    public Page<BidDto> getUserBids(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return bidRepo.findByUserId(userId, pageable).map(this::toBidDto);
    }

    @Transactional
    public void cancelBid(Long id, Long userId) {
        Bid bid = bidRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Bid not found"));
        if (bid.getStatus() != BidStatus.PENDING)
            throw new RuntimeException("Only pending bids can be cancelled");
        bidRepo.delete(bid);
    }

    // ---- ENQUIRIES ----
    @Transactional
    public EnquiryDto postEnquiry(Long userId, EnquiryRequest req) {
        Enquiry enquiry = Enquiry.builder()
                .userId(userId).productId(req.getProductId())
                .subject(req.getSubject()).message(req.getMessage())
                .attachmentUrl(req.getAttachmentUrl()).contactName(req.getContactName())
                .contactEmail(req.getContactEmail()).contactPhone(req.getContactPhone())
                .status(EnquiryStatus.OPEN).build();
        return toEnquiryDto(enquiryRepo.save(enquiry));
    }

    public Page<EnquiryDto> getUserEnquiries(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return enquiryRepo.findByUserId(userId, pageable).map(this::toEnquiryDto);
    }

    @Transactional
    public EnquiryDto updateEnquiry(Long id, Long userId, EnquiryRequest req) {
        Enquiry e = enquiryRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Enquiry not found"));
        e.setSubject(req.getSubject()); e.setMessage(req.getMessage());
        e.setContactName(req.getContactName()); e.setContactEmail(req.getContactEmail());
        e.setContactPhone(req.getContactPhone());
        return toEnquiryDto(enquiryRepo.save(e));
    }

    @Transactional
    public void deleteEnquiry(Long id, Long userId) {
        Enquiry e = enquiryRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Enquiry not found"));
        enquiryRepo.delete(e);
    }

    // ---- MAPPERS ----
    private WishlistDto toWishlistDto(WishlistItem i) {
        return WishlistDto.builder().id(i.getId()).productId(i.getProductId())
                .productName(i.getProductName()).partNumber(i.getPartNumber())
                .brand(i.getBrand()).price(i.getPrice()).quantity(i.getQuantity())
                .notes(i.getNotes()).deliveryAddress(i.getDeliveryAddress())
                .contactPerson(i.getContactPerson()).contactPhone(i.getContactPhone())
                .status(i.getStatus().name()).createdAt(i.getCreatedAt()).build();
    }

    private BidDto toBidDto(Bid b) {
        return BidDto.builder().id(b.getId()).userId(b.getUserId()).productId(b.getProductId())
                .productName(b.getProductName()).partNumber(b.getPartNumber())
                .offerPrice(b.getOfferPrice()).quantity(b.getQuantity())
                .message(b.getMessage()).deliveryAddress(b.getDeliveryAddress())
                .contactPerson(b.getContactPerson()).contactPhone(b.getContactPhone())
                .bidderType(b.getBidderType() != null ? b.getBidderType().name() : null)
                .status(b.getStatus().name()).adminResponse(b.getAdminResponse())
                .createdAt(b.getCreatedAt()).build();
    }

    private EnquiryDto toEnquiryDto(Enquiry e) {
        return EnquiryDto.builder().id(e.getId()).userId(e.getUserId()).productId(e.getProductId())
                .subject(e.getSubject()).message(e.getMessage())
                .attachmentUrl(e.getAttachmentUrl()).contactName(e.getContactName())
                .contactEmail(e.getContactEmail()).contactPhone(e.getContactPhone())
                .status(e.getStatus().name()).adminReply(e.getAdminReply())
                .createdAt(e.getCreatedAt()).build();
    }

    // ── Purchases ─────────────────────────────────────────────────────────────

    @Transactional
    public PurchaseDto createPurchase(Long userId, PurchaseRequest req) {
        java.math.BigDecimal total = req.getUnitPrice()
                .multiply(java.math.BigDecimal.valueOf(req.getQuantity()));
        Purchase purchase = Purchase.builder()
                .userId(userId).productId(req.getProductId())
                .productName(req.getProductName()).partNumber(req.getPartNumber())
                .brand(req.getBrand()).quantity(req.getQuantity())
                .unitPrice(req.getUnitPrice()).totalAmount(total)
                .deliveryAddress(req.getDeliveryAddress())
                .contactName(req.getContactName()).contactPhone(req.getContactPhone())
                .notes(req.getNotes())
                .paymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : "COD")
                .paymentId(req.getPaymentId())
                .razorpayOrderId(req.getRazorpayOrderId())
                .paymentStatus("ONLINE".equals(req.getPaymentMethod()) && req.getPaymentId() != null
                    ? PaymentStatus.PAID : PaymentStatus.COD_PENDING)
                .status("ONLINE".equals(req.getPaymentMethod()) && req.getPaymentId() != null
                    ? PurchaseStatus.CONFIRMED : PurchaseStatus.PENDING)
                .expectedDeliveryDate(calculateExpectedDelivery())
                .build();
        Purchase saved = purchaseRepo.save(purchase);
        // Notify customer their order was placed
        try {
            kafkaTemplate.send("order-events", java.util.Map.of(
                "userId",      userId.toString(),
                "orderId",     saved.getId().toString(),
                "productName", req.getProductName() != null ? req.getProductName() : "",
                "totalAmount", total.toPlainString(),
                "status",      "PENDING"
            ));
        } catch (Exception ex) {
            log.warn("Could not send order notification: {}", ex.getMessage());
        }
        return toPurchaseDto(saved);
    }

    public org.springframework.data.domain.Page<PurchaseDto> getMyPurchases(Long userId, int page, int size) {
        return purchaseRepo.findByUserIdOrderByCreatedAtDesc(userId,
                org.springframework.data.domain.PageRequest.of(page, size))
                .map(this::toPurchaseDto);
    }

    public org.springframework.data.domain.Page<PurchaseDto> getAllPurchases(int page, int size) {
        return purchaseRepo.findAll(
                org.springframework.data.domain.PageRequest.of(page, size,
                    org.springframework.data.domain.Sort.by("createdAt").descending()))
                .map(this::toPurchaseDto);
    }

    @Transactional
    public PurchaseDto updatePurchaseStatus(Long id, String status) {
        Purchase p = purchaseRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found: " + id));
        p.setStatus(PurchaseStatus.valueOf(status.toUpperCase()));
        return toPurchaseDto(purchaseRepo.save(p));
    }

    @Transactional
    public void cancelPurchase(Long id, Long userId) {
        Purchase p = purchaseRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found: " + id));
        if (!p.getUserId().equals(userId))
            throw new RuntimeException("Unauthorized");
        if (p.getStatus() != PurchaseStatus.PENDING)
            throw new RuntimeException("Only pending purchases can be cancelled");
        p.setStatus(PurchaseStatus.CANCELLED);
        purchaseRepo.save(p);
    }

    private PurchaseDto toPurchaseDto(Purchase p) {
        return PurchaseDto.builder()
                .id(p.getId()).userId(p.getUserId()).productId(p.getProductId())
                .productName(p.getProductName()).partNumber(p.getPartNumber()).brand(p.getBrand())
                .quantity(p.getQuantity()).unitPrice(p.getUnitPrice()).totalAmount(p.getTotalAmount())
                .deliveryAddress(p.getDeliveryAddress()).contactName(p.getContactName())
                .contactPhone(p.getContactPhone()).notes(p.getNotes())
                .status(p.getStatus().name())
                .paymentMethod(p.getPaymentMethod())
                .paymentId(p.getPaymentId())
                .paymentStatus(p.getPaymentStatus() != null ? p.getPaymentStatus().name() : null)
                .deliveryPartner(p.getDeliveryPartner())
                .trackingNumber(p.getTrackingNumber())
                .expectedDeliveryDate(p.getExpectedDeliveryDate())
                .actualDeliveryDate(p.getActualDeliveryDate())
                .createdAt(p.getCreatedAt()).build();
    }



    @Transactional
    public PurchaseDto updateDeliveryInfo(Long id, String deliveryPartner, String trackingNumber) {
        Purchase p = purchaseRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found: " + id));
        if (deliveryPartner != null && !deliveryPartner.isBlank()) p.setDeliveryPartner(deliveryPartner);
        if (trackingNumber != null && !trackingNumber.isBlank()) p.setTrackingNumber(trackingNumber);
        // Auto-advance to SHIPPED if CONFIRMED and tracking is being assigned
        if (trackingNumber != null && !trackingNumber.isBlank() && p.getStatus() == PurchaseStatus.CONFIRMED) {
            p.setStatus(PurchaseStatus.SHIPPED);
        }
        return toPurchaseDto(purchaseRepo.save(p));
    }

    @Transactional
    public PurchaseDto markDelivered(Long id) {
        Purchase p = purchaseRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found: " + id));
        p.setStatus(PurchaseStatus.DELIVERED);
        p.setActualDeliveryDate(LocalDateTime.now());
        return toPurchaseDto(purchaseRepo.save(p));
    }

    /** Returns expected delivery: 5 business days from now (skipping weekends) */
    private LocalDateTime calculateExpectedDelivery() {
        LocalDateTime date = LocalDateTime.now();
        int businessDays = 0;
        while (businessDays < 5) {
            date = date.plusDays(1);
            int dow = date.getDayOfWeek().getValue(); // 1=Mon...7=Sun
            if (dow < 6) businessDays++; // skip Sat(6) and Sun(7)
        }
        return date.withHour(18).withMinute(0).withSecond(0).withNano(0);
    }

}

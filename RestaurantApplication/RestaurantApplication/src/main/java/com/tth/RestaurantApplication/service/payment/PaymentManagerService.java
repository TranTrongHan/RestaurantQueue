package com.tth.RestaurantApplication.service.payment;

import com.tth.RestaurantApplication.constant.PaymentType;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.entity.Bill;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.repository.BillRepository;
import com.tth.RestaurantApplication.repository.OnlineCartRepository;
import com.tth.RestaurantApplication.repository.OrderRepository;
import com.tth.RestaurantApplication.service.MembershipService;
import com.tth.RestaurantApplication.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentManagerService {

    private final List<PaymentGateway> gateways;
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final OnlineCartRepository cartRepository;
    private final MembershipService membershipService;
    private final BillRepository billRepository;
    private final Map<String, String> pendingPayments = new java.util.concurrent.ConcurrentHashMap<>();

    public PaymentGateway getGateway(PaymentType type) {
        return gateways.stream()
                .filter(g -> g.getPaymentType() == type)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION)); // Or a better error code
    }

    public String createPaymentUrl(Order order, PaymentType type, Long amount, String returnUrl) throws Exception {
        PaymentGateway gateway = getGateway(type);
        String url = gateway.createPaymentUrl(order.getOrderId(), amount, returnUrl);
        
        // Extract txnRef to use as key
        String txnRef = extractTxnRef(url);
        if (txnRef != null) {
            pendingPayments.put(txnRef, url);
            log.info("Stored pending payment for txnRef: {}", txnRef);
        }
        
        return url;
    }

    private String extractTxnRef(String url) {
        try {
            java.net.URI uri = new java.net.URI(url);
            String query = uri.getQuery();
            if (query == null) return null;
            for (String param : query.split("&")) {
                String[] pair = param.split("=");
                if (pair.length > 1 && pair[0].equals("vnp_TxnRef")) {
                    return java.net.URLDecoder.decode(pair[1], java.nio.charset.StandardCharsets.UTF_8);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract vnp_TxnRef from url: {}", url);
        }
        return null;
    }

    @Transactional
    public BillResponse handlePaymentReturn(PaymentType type, Map<String, String> params, User currentUser) throws Exception {
        PaymentGateway gateway = getGateway(type);

        if (!gateway.verifySignature(params)) {
            // Trick Lỏ: In local dev, we might want to be more lenient or log more
            log.warn("Signature verification failed for params: {}", params);
            throw new AppException(ErrorCode.INVALID_SIGNATURE);
        }

        String txnRef = params.get("vnp_TxnRef");
        if (pendingPayments.containsKey(txnRef)) {
            log.info("Match found in pendingPayments cache for txnRef: {}", txnRef);
            // Optionally compare amounts here if you want to be extra strict
            pendingPayments.remove(txnRef); // Use once
        }

        String orderIdStr = gateway.getOrderId(params);
        Integer orderId = Integer.valueOf(orderIdStr);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (gateway.isSuccess(params)) {
            return finalizePayment(order, params, currentUser);
        } else {
            log.warn("Payment failed for order {} using {}", orderId, type);
            throw new AppException(ErrorCode.PAYMENT_FAILED);
        }
    }

    @Transactional
    public String handlePaymentIpn(PaymentType type, Map<String, String> params) throws Exception {
        PaymentGateway gateway = getGateway(type);

        try {
            if (!gateway.verifySignature(params)) {
                return "{\"RspCode\":\"01\",\"Message\":\"Invalid signature\"}";
            }

            String orderIdStr = gateway.getOrderId(params);
            Integer orderId = Integer.valueOf(orderIdStr);
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

            if (Boolean.TRUE.equals(order.getIsPaid())) {
                return "{\"RspCode\":\"02\",\"Message\":\"Order already confirmed\"}";
            }

            if (gateway.isSuccess(params)) {
                finalizePayment(order, params, null);
                return "{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}";
            } else {
                return "{\"RspCode\":\"00\",\"Message\":\"Payment failed reported\"}";
            }
        } catch (Exception e) {
            log.error("IPN Error", e);
            return "{\"RspCode\":\"99\",\"Message\":\"Unknown error\"}";
        }
    }

    private BillResponse finalizePayment(Order order, Map<String, String> params, User currentUser) {
        Long amountLong = 0L;
        if (params.containsKey("vnp_Amount")) {
            amountLong = Long.parseLong(params.get("vnp_Amount")) / 100;
        }

        order.setIsPaid(true);
        orderRepository.save(order);

        User user = (currentUser != null) ? currentUser :
                (order.getOrderSession() != null ? order.getOrderSession().getReservation().getUser() :
                        (order.getOnlineOrder() != null ? order.getOnlineOrder().getUser() : null));

        if (user != null) {
            cartRepository.deleteByUser(user);
        }

        BillResponse billResponse;
        if (order.getOrderSession() != null) {
            billResponse = paymentService.createBillForDineInOrder(order, null, BigDecimal.valueOf(amountLong));
        } else {
            billResponse = paymentService.createBill(order, null, BigDecimal.valueOf(amountLong));
        }

        // === UC03 & UC04: Tích điểm và thăng hạng sau khi thanh toán thành công ===
        if (user != null) {
            try {
                Bill bill = billRepository.findByOrder_OrderId(order.getOrderId())
                        .orElse(null);
                membershipService.processSuccessfulPayment(
                        user,
                        BigDecimal.valueOf(amountLong),
                        bill
                );
                log.info("[Membership] Loyalty points processed for user={}, amount={}", user.getUsername(), amountLong);
            } catch (Exception e) {
                // Không để lỗi membership ảnh hưởng đến luồng thanh toán chính
                log.error("[Membership] Failed to process loyalty for user={}: {}", user != null ? user.getUsername() : "unknown", e.getMessage());
            }
        }

        return billResponse;
    }
}

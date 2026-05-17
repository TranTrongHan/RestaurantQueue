package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.PaymentRequest;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.OrderResponse;
import com.tth.RestaurantApplication.dto.response.OrderSessionResponse;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.service.AuthenticateService;
import com.tth.RestaurantApplication.service.JwtService;
import com.tth.RestaurantApplication.service.OrderSessionService;
import jakarta.transaction.Transactional;
import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api/order_session")
public class OrderSessionController {
    OrderSessionService orderSessionService;
    JwtService jwtService;
    com.tth.RestaurantApplication.service.payment.PaymentManagerService paymentManagerService;
    com.tth.RestaurantApplication.service.VoucherService voucherService;
    com.tth.RestaurantApplication.service.OrderManagementService orderManagementService;
    AuthenticateService authenticateService;

    @GetMapping("/validate")
    public ApiResponse<OrderSessionResponse> validateSession(@RequestParam("token") String token) {
        System.out.println("Received token: " + token);
        return ApiResponse.<OrderSessionResponse>builder()
                .result(orderSessionService.validateSession(token))
                .build();
    }

    @GetMapping("/join")
    public ApiResponse<OrderSessionResponse> joinSession(@RequestParam("token") String token) throws JOSEException {
        return ApiResponse.<OrderSessionResponse>builder()
                .result(orderSessionService.joinSessionWithToken(token))
                .build();
    }

    @GetMapping("/active-session")
    public ApiResponse<OrderSessionResponse> getActiveSession(@RequestParam("tableId") Integer tableId) {
        return ApiResponse.<OrderSessionResponse>builder()
                .result(orderSessionService.getActiveSessionForTable(tableId))
                .build();
    }



    @GetMapping("/{sessionId}")
    public ApiResponse<OrderResponse> getOrder(@PathVariable(value = "sessionId") Integer sessionId) {
        return ApiResponse.<OrderResponse>builder()
                .result(orderSessionService.getOrder(sessionId))
                .build();
    }

    @PostMapping("/{sessionId}")
    ApiResponse<BillResponse> pay(@PathVariable(value = "sessionId") Integer sessionId) {
        return ApiResponse.<BillResponse>builder()
                .result(orderSessionService.pay(sessionId))
                .message("pay successful")
                .build();
    }

    @PostMapping("/request-payment/{sessionId}")
    ApiResponse<String> requestPayment(@PathVariable(value = "sessionId") Integer sessionId) {
        orderSessionService.requestPayment(sessionId);
        return ApiResponse.<String>builder()
                .result("Payment requested successful")
                .build();
    }

    @PostMapping("/check-voucher/{sessionId}")
    public ApiResponse<Map<String, Object>> checkVoucher(@PathVariable Integer sessionId,
            @RequestParam String voucherCode) {
        Order order = orderSessionService.getCurrentUserOrder(sessionId);
        BigDecimal subTotal = orderManagementService.calculateGrossSubtotal(order.getOrderId());
        User customer = order.getOrderSession().getReservation().getUser();

        BigDecimal discount = voucherService.validateAndCalculateDiscount(voucherCode, subTotal, customer,
                com.tth.RestaurantApplication.entity.Voucher.ApplyType.DINE_IN);

        return ApiResponse.<Map<String, Object>>builder()
                .result(Map.of(
                        "subTotal", subTotal,
                        "discount", discount,
                        "finalTotal", subTotal.subtract(discount)))
                .build();
    }

    @Transactional
    @PostMapping("/createPayment/{sessionId}")
    public ApiResponse<String> createPayment(@RequestBody(required = false) PaymentRequest request,
            @PathVariable(value = "sessionId") Integer sessionId,
            @RequestParam String returnUrl) throws Exception {
        log.info("return url received: {}", returnUrl);
        Order order = orderSessionService.getCurrentUserOrder(sessionId);
        BigDecimal subTotal = orderManagementService.calculateGrossSubtotal(order.getOrderId());
        User customer = order.getOrderSession().getReservation().getUser();

        BigDecimal discountAmount = BigDecimal.ZERO;
        String voucherCode = (request != null) ? request.getPromotionName() : null;

        if (voucherCode != null && !voucherCode.isEmpty()) {
            try {
                discountAmount = voucherService.validateAndCalculateDiscount(voucherCode, subTotal, customer,
                        com.tth.RestaurantApplication.entity.Voucher.ApplyType.DINE_IN);

                if (returnUrl.contains("?")) {
                    returnUrl += "&promotionName=" + voucherCode;
                } else {
                    returnUrl += "?promotionName=" + voucherCode;
                }
            } catch (Exception e) {
                log.warn("Invalid voucher code for session {}: {}", sessionId, voucherCode);
                // We could throw an error or just proceed without discount
                throw e;
            }
        }

        BigDecimal finalAmount = subTotal.subtract(discountAmount);

        String paymentUrl = paymentManagerService.createPaymentUrl(
                order,
                request != null ? request.getPaymentType() : com.tth.RestaurantApplication.constant.PaymentType.VNPAY,
                finalAmount.longValue(),
                returnUrl);

        return ApiResponse.<String>builder()
                .result(paymentUrl)
                .message("Create payment url success")
                .build();
    }

    @Transactional
    @GetMapping("/vnpayReturn")
    public ApiResponse<BillResponse> vnpayReturn(@RequestParam Map<String, String> params) throws Exception {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        BillResponse bill = paymentManagerService.handlePaymentReturn(com.tth.RestaurantApplication.constant.PaymentType.VNPAY, params, currentUser);
        return ApiResponse.<BillResponse>builder()
                .result(bill)
                .message("Payment verified and bill created")
                .build();
    }

    @GetMapping("/vnpayIpn")
    public String vnpayIpn(@RequestParam Map<String, String> params) throws Exception {
        return paymentManagerService.handlePaymentIpn(com.tth.RestaurantApplication.constant.PaymentType.VNPAY, params);
    }



}

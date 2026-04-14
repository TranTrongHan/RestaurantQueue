package com.tth.RestaurantApplication.controller;

import com.nimbusds.jose.JOSEException;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.PaymentRequest;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.OnlineOrderResponse;
import com.tth.RestaurantApplication.dto.response.PageResponse;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.service.AuthenticateService;
import com.tth.RestaurantApplication.service.OnlineOrderService;
import com.tth.RestaurantApplication.service.OrderManagementService;
import com.tth.RestaurantApplication.service.VoucherService;
import com.tth.RestaurantApplication.service.payment.PaymentManagerService;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.text.ParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/online_order")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class OnlineOrderController {
    OnlineOrderService onlineOrderService;
    AuthenticateService authenticateService;
    OrderManagementService orderManagementService;
    PaymentManagerService paymentManagerService;
    VoucherService voucherService;

    @PostMapping("/check-voucher")
    public ApiResponse<Map<String, Object>> checkVoucher(@RequestParam String voucherCode) {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        BigDecimal subTotal = orderManagementService.calculateCartSubtotal(currentUser);

        BigDecimal discount = voucherService.validateAndCalculateDiscount(voucherCode, subTotal, currentUser,
                com.tth.RestaurantApplication.entity.Voucher.ApplyType.ONLINE);

        return ApiResponse.<Map<String, Object>>builder()
                .result(Map.of(
                        "subTotal", subTotal,
                        "discount", discount,
                        "finalTotal", subTotal.subtract(discount)))
                .build();
    }

    @Transactional
    @PostMapping("/createPayment")
    public ApiResponse<String> createPayment(@RequestBody(required = false) PaymentRequest request,
            @RequestParam String returnUrl) throws Exception {
        log.info("return url received: {}", returnUrl);
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        Order order = orderManagementService.createForOnlineOrder(currentUser);
        BigDecimal subTotal = orderManagementService.createOrderItemsFromCartForOnlineOrderAndGetSubTotal(currentUser,
                order);

        BigDecimal discountAmount = BigDecimal.ZERO;
        String voucherCode = (request != null) ? request.getPromotionName() : null;

        if (voucherCode != null && !voucherCode.isEmpty()) {
            try {
                discountAmount = voucherService.validateAndCalculateDiscount(voucherCode, subTotal, currentUser,
                        com.tth.RestaurantApplication.entity.Voucher.ApplyType.ONLINE);
                // Append voucherCode to returnUrl so vnpayReturn can use it to create the Bill
                // correctly
                if (returnUrl.contains("?")) {
                    returnUrl += "&promotionName=" + voucherCode;
                } else {
                    returnUrl += "?promotionName=" + voucherCode;
                }
            } catch (Exception e) {
                log.warn("Invalid voucher code for user {}: {}", currentUser.getUsername(), voucherCode);
                // Reset discount if invalid, but we might want to throw error as in Dine-in
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
        BillResponse bill = paymentManagerService
                .handlePaymentReturn(com.tth.RestaurantApplication.constant.PaymentType.VNPAY, params, currentUser);
        return ApiResponse.<BillResponse>builder()
                .result(bill)
                .message("Payment verified and bill created")
                .build();
    }

    @PostMapping
    ApiResponse<BillResponse> payment(@RequestBody(required = false) PaymentRequest request)
            throws ParseException, JOSEException {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        log.info("in controller");
        return ApiResponse.<BillResponse>builder()
                .result(onlineOrderService.processOnlinePayment(currentUser, request))
                .message("Pay successfull")
                .build();
    }

    @GetMapping("/my")
    ApiResponse<List<OnlineOrderResponse>> getMyOrders() throws ParseException, JOSEException {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();

        return ApiResponse.<List<OnlineOrderResponse>>builder()
                .result(onlineOrderService.getOnlineOrder(currentUser))
                .build();
    }

}

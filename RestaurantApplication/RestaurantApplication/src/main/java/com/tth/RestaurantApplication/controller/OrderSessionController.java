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
    AuthenticateService authenticateService;
    OrderSessionService orderSessionService;
    JwtService jwtService;
    com.tth.RestaurantApplication.service.payment.PaymentManagerService paymentManagerService;

    @GetMapping("/validate")
    public ApiResponse<OrderSessionResponse> validateSession(@RequestParam("token") String token) {
        System.out.println("Received token: " + token);
        return ApiResponse.<OrderSessionResponse>builder()
                .result(orderSessionService.validateSession(token))
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

    @PostMapping("/createPayment/{sessionId}")
    public ApiResponse<String> createPayment(@RequestBody(required = false) PaymentRequest request,
            @PathVariable(value = "sessionId") Integer sessionId,
            @RequestParam String returnUrl) throws Exception {
        log.info("return url received: {}", returnUrl);
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        Order order = orderSessionService.getCurrentUserOrder(sessionId);
        BigDecimal subTotal = orderSessionService.getSubTotal(currentUser, order);
        
        String paymentUrl = paymentManagerService.createPaymentUrl(
                order, 
                request != null ? request.getPaymentType() : com.tth.RestaurantApplication.constant.PaymentType.VNPAY, 
                subTotal.longValue(), 
                returnUrl
        );
        
        return ApiResponse.<String>builder()
                .result(paymentUrl)
                .message("Create payment url success")
                .build();
    }

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

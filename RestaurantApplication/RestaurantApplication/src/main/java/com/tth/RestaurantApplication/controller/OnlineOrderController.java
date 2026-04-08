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
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class OnlineOrderController {
    OnlineOrderService onlineOrderService;
    AuthenticateService authenticateService;
    OrderManagementService orderManagementService;
    com.tth.RestaurantApplication.service.payment.PaymentManagerService paymentManagerService;

    @PostMapping("/createPayment")
    public ApiResponse<String> createPayment(@RequestBody(required = false) PaymentRequest request,
                                             @RequestParam String returnUrl) throws Exception {
        log.info("return url received: {}",returnUrl);
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        Order order = orderManagementService.createForOnlineOrder(currentUser);
        BigDecimal subTotal = orderManagementService.createOrderItemsFromCartForOnlineOrderAndGetSubTotal(currentUser, order);
        
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
    @PostMapping
    ApiResponse<BillResponse> payment(@RequestBody(required = false) PaymentRequest request) throws ParseException, JOSEException {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        log.info("in controller");
        return ApiResponse.<BillResponse>builder()
                .result(onlineOrderService.processOnlinePayment(currentUser,request))
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

    @GetMapping("/admin")
    ApiResponse<PageResponse<OnlineOrderResponse>> getAllOrders(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam Map<String, String> params
    ) {
        return ApiResponse.<PageResponse<OnlineOrderResponse>>builder()
                .result(onlineOrderService.getAllOnlineOrders(page, size, params))
                .build();
    }

    @GetMapping("/admin/{onlineOrderId}")
    ApiResponse<OnlineOrderResponse> getOrderDetail(@PathVariable Integer onlineOrderId) {
        return ApiResponse.<OnlineOrderResponse>builder()
                .result(onlineOrderService.getOnlineOrderDetail(onlineOrderId))
                .build();
    }
}

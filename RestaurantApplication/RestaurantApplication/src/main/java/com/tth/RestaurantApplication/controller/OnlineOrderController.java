package com.tth.RestaurantApplication.controller;

import com.nimbusds.jose.JOSEException;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.PaymentRequest;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.OnlineOrderResponse;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.service.AuthenticateService;
import com.tth.RestaurantApplication.service.OnlineOrderService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

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


    @PostMapping("/createPayment")
    public ApiResponse<String> createPayment(@RequestBody(required = false) PaymentRequest request,
                                             @RequestHeader("Authorization") String token) throws Exception {
        User currentUser = authenticateService.getCurrentUser(token.substring(7));

        String paymentUrl = onlineOrderService.createPaymentUrl(currentUser, request);
        return ApiResponse.<String>builder()
                .result(paymentUrl)
                .message("Create payment url success")
                .build();
    }

    @GetMapping("/vnpayReturn")
    public ApiResponse<BillResponse> vnpayReturn(@RequestParam Map<String, String> params,
                                                 @RequestHeader("Authorization") String token) throws Exception {
        User currentUser = authenticateService.getCurrentUser(token.substring(7));
        BillResponse bill = onlineOrderService.handleVnpayReturn(params, currentUser);
        return ApiResponse.<BillResponse>builder()
                .result(bill)
                .message("Payment verified and bill created")
                .build();
    }
    @PostMapping
    ApiResponse<BillResponse> payment(@RequestBody(required = false) PaymentRequest request, @RequestHeader("Authorization") String token) throws ParseException, JOSEException {
        User currentUser = authenticateService.getCurrentUser(token.substring(7));
        log.info("in controller");
        return ApiResponse.<BillResponse>builder()
                .result(onlineOrderService.processOnlinePayment(currentUser,request))
                .message("Pay successfull")
                .build();
    }

    @GetMapping("/my")
    ApiResponse<List<OnlineOrderResponse>> getMyOrders(@RequestHeader("Authorization") String token) throws ParseException, JOSEException {
        User currentUser = authenticateService.getCurrentUser(token.substring(7));

        return ApiResponse.<List<OnlineOrderResponse>>builder()
                .result(onlineOrderService.getOnlineOrder(currentUser))
                .build();
    }
}

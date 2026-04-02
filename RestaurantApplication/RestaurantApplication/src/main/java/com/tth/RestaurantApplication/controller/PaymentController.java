package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.constant.PaymentType;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.service.AuthenticateService;
import com.tth.RestaurantApplication.service.payment.PaymentManagerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentManagerService paymentManagerService;
    private final AuthenticateService authenticateService;

    @GetMapping("/vnpayReturn")
    public ApiResponse<BillResponse> vnpayReturn(@RequestParam Map<String, String> params) throws Exception {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        BillResponse bill = paymentManagerService.handlePaymentReturn(PaymentType.VNPAY, params, currentUser);
        return ApiResponse.<BillResponse>builder()
                .result(bill)
                .message("Payment verified and bill created")
                .build();
    }

    @GetMapping("/vnpayIpn")
    public String vnpayIpn(@RequestParam Map<String, String> params) throws Exception {
        return paymentManagerService.handlePaymentIpn(PaymentType.VNPAY, params);
    }
}

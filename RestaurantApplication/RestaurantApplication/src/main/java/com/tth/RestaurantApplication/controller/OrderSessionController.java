package com.tth.RestaurantApplication.controller;


import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.JWTClaimsSet;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.OrderRequest;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.OrderItemResponse;
import com.tth.RestaurantApplication.dto.response.OrderResponse;
import com.tth.RestaurantApplication.dto.response.OrderSessionResponse;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.service.JwtService;
import com.tth.RestaurantApplication.service.OrderSessionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@RequestMapping("/api/order_session")
public class OrderSessionController {

    OrderSessionService orderSessionService;
    JwtService jwtService;
    @GetMapping("/validate")
    public ApiResponse<OrderSessionResponse> validateSession(@RequestParam("token") String token){
        System.out.println("Received token: " + token);
        return ApiResponse.<OrderSessionResponse>builder()
                .result(orderSessionService.validateSession(token))
                .build();
    }
    @GetMapping("/{sessionId}")
    public ApiResponse<OrderResponse> getOrder(@PathVariable(value = "sessionId") Integer sessionId){
        return ApiResponse.<OrderResponse>builder()
                .result(orderSessionService.getOrder(sessionId))
                .build();
    }

    @PostMapping("/{sessionId}/orderitems")
    ApiResponse<List<OrderItemResponse>> order(@PathVariable(value = "sessionId") Integer sessionId, @RequestBody @Valid OrderRequest orderRequest,
                                               @RequestHeader("Authorization") String authHeader) throws ParseException, JOSEException {
        String token =  authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
        log.info("token : {}" ,token);
        JWTClaimsSet claims = jwtService.validateAndExtractClaims(token);
        Integer sessionIdFromJwt = claims.getIntegerClaim("sessionId");
        log.info("sesionIdFromJwt: {}",sessionIdFromJwt);
        if (!sessionId.equals(sessionIdFromJwt)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return ApiResponse.<List<OrderItemResponse>>builder()
                .result(orderSessionService.createOrderItem(orderRequest,sessionId))
                .message("Send food successfull")
                .build();
    }
    @PostMapping("/{sessionId}")
    ApiResponse<BillResponse> pay(@PathVariable(value = "sessionId") Integer sessionId){
        return ApiResponse.<BillResponse>builder()
                .result(orderSessionService.pay(sessionId))
                .message("pay successful")
                .build();
    }
    @DeleteMapping("/{orderItemId}")
    ApiResponse<String> cancelOrderItem(@PathVariable(value = "orderItemId") Integer orderItemId){
        orderSessionService.cancelOrderItem(orderItemId);
        return ApiResponse.<String>builder()
                .result("OrderItem hủy thành công")
                .build();
    }
}

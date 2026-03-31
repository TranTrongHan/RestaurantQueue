package com.tth.RestaurantApplication.controller;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.JWTClaimsSet;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.OrderRequest;
import com.tth.RestaurantApplication.dto.response.OrderItemResponse;
import com.tth.RestaurantApplication.entity.OrderItem;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.service.JwtService;
import com.tth.RestaurantApplication.service.OrderItemService;
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
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api/order_item")
public class OrderItemController {
    OrderItemService orderItemService;
    JwtService jwtService;

    @PostMapping("/{sessionId}")
    public ApiResponse<List<OrderItemResponse>> createOrderItems(@PathVariable(value = "sessionId") Integer sessionId,
                                                                 @RequestBody @Valid OrderRequest orderRequest,
                                                                 @RequestHeader(value = "Authorization", required = false) String authHeader) throws ParseException, JOSEException {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            JWTClaimsSet claims = jwtService.validateAndExtractClaims(token);
            Integer sessionIdFromJwt = claims.getIntegerClaim("sessionId");
            if (!sessionId.equals(sessionIdFromJwt)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        return ApiResponse.<List<OrderItemResponse>>builder()
                .result(orderItemService.createOrderItem(orderRequest, sessionId))
                .message("Send food successful")
                .build();
    }

    @DeleteMapping("/{orderItemId}")
    public ApiResponse<String> cancelOrderItem(@PathVariable(value = "orderItemId") Integer orderItemId) {
        orderItemService.cancelOrderItem(orderItemId);
        return ApiResponse.<String>builder()
                .result("OrderItem canceled successfully")
                .build();
    }

    @PutMapping("/{orderItemId}/status")
    public ApiResponse<OrderItemResponse> updateStatus(@PathVariable(value = "orderItemId") Integer orderItemId,
                                                       @RequestParam("status") OrderItem.OrderItemStatus status) {
        return ApiResponse.<OrderItemResponse>builder()
                .result(orderItemService.updateStatus(orderItemId, status))
                .message("Status updated successfully")
                .build();
    }
}

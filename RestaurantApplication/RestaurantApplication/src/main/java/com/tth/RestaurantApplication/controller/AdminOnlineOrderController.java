package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.response.OnlineOrderResponse;
import com.tth.RestaurantApplication.dto.response.PageResponse;
import com.tth.RestaurantApplication.service.OnlineOrderService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/online_order")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class AdminOnlineOrderController {

    OnlineOrderService onlineOrderService;

    @GetMapping()
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<PageResponse<OnlineOrderResponse>> getAllOrders(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam Map<String, String> params) {
        return ApiResponse.<PageResponse<OnlineOrderResponse>>builder()
                .result(onlineOrderService.getAllOnlineOrders(page, size, params))
                .build();
    }

    @GetMapping("/{onlineOrderId}")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<OnlineOrderResponse> getOrderDetail(@PathVariable Integer onlineOrderId) {
        return ApiResponse.<OnlineOrderResponse>builder()
                .result(onlineOrderService.getOnlineOrderDetail(onlineOrderId))
                .build();
    }
}

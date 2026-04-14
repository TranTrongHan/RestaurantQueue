package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.response.OrderItemResponse;
import com.tth.RestaurantApplication.entity.OrderItem;
import com.tth.RestaurantApplication.service.OrderItemService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api/admin/order_item")
public class AdminOrderItemController {
    OrderItemService orderItemService;

    @PutMapping("/{orderItemId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<OrderItemResponse> updateStatus(@PathVariable(value = "orderItemId") Integer orderItemId,
                                                       @RequestParam("status") OrderItem.OrderItemStatus status) {
        return ApiResponse.<OrderItemResponse>builder()
                .result(orderItemService.updateStatus(orderItemId, status))
                .message("Status updated successfully")
                .build();
    }
}

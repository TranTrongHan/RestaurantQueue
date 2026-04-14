package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.UserUpdateRequest;
import com.tth.RestaurantApplication.dto.response.CustomerOrderHistoryResponse;
import com.tth.RestaurantApplication.dto.response.PageResponse;
import com.tth.RestaurantApplication.dto.response.UserResponse;
import com.tth.RestaurantApplication.dto.response.UserVoucherResponse;
import com.tth.RestaurantApplication.service.OrderManagementService;
import com.tth.RestaurantApplication.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminCustomerController {

    UserService userService;
    OrderManagementService orderManagementService;
    com.tth.RestaurantApplication.service.VoucherService voucherService;

    @GetMapping
    public ApiResponse<PageResponse<UserResponse>> getCustomers(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "search", required = false) String search) {
        return ApiResponse.<PageResponse<UserResponse>>builder()
                .result(userService.getCustomers(page, size, search))
                .build();
    }

    @GetMapping("/{userId}")
    public ApiResponse<UserResponse> getCustomerDetail(@PathVariable String userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.findUser(userId))
                .build();
    }

    @PutMapping("/{userId}")
    public ApiResponse<UserResponse> updateCustomer(
            @PathVariable String userId,
            @RequestBody UserUpdateRequest request) throws IOException {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(userId, request))
                .build();
    }

    @GetMapping("/{userId}/orders")
    public ApiResponse<List<CustomerOrderHistoryResponse>> getCustomerOrderHistory(@PathVariable Integer userId) {
        return ApiResponse.<List<CustomerOrderHistoryResponse>>builder()
                .result(orderManagementService.getCustomerOrderHistory(userId))
                .build();
    }

    @GetMapping("/{userId}/vouchers")
    public ApiResponse<List<UserVoucherResponse>> getCustomerVouchers(@PathVariable Integer userId) {
        return ApiResponse.<List<UserVoucherResponse>>builder()
                .result(voucherService.getVouchersByUserId(userId))
                .build();
    }
}

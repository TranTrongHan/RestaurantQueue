package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.service.StatsService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticController {

    StatsService statsService;

    @GetMapping("/revenue")
    public ApiResponse<List<Object[]>> getRevenueStats(
            @RequestParam(defaultValue = "WEEK") String period,
            @RequestParam(defaultValue = "DINE_IN") String orderType) {
        return ApiResponse.<List<Object[]>>builder()
                .result(statsService.statsRevenue(period, orderType))
                .build();
    }

    @GetMapping("/revenue-by-menu")
    public ApiResponse<List<Object[]>> getRevenueByMenu(
            @RequestParam(defaultValue = "TODAY") String period,
            @RequestParam(defaultValue = "DINE_IN") String orderType) {
        return ApiResponse.<List<Object[]>>builder()
                .result(statsService.statsRevenueByMenu(period, orderType))
                .build();
    }

    @GetMapping("/kitchen-efficiency")
    public ApiResponse<List<Map<String, Object>>> getKitchenEfficiency() {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(statsService.getKitchenEfficiencyStats())
                .build();
    }

    @GetMapping("/tier-wait-time")
    public ApiResponse<List<Map<String, Object>>> getTierWaitTime() {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(statsService.getWaitTimeByTierStats())
                .build();
    }

    @GetMapping("/bottlenecks")
    public ApiResponse<List<Map<String, Object>>> getBottlenecks() {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(statsService.getBottleneckDishes())
                .build();
    }
}

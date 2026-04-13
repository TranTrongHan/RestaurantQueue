package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.AdjustPointsRequest;
import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.request.VoucherCreateRequest;
import com.tth.RestaurantApplication.dto.response.PointTransactionResponse;
import com.tth.RestaurantApplication.dto.response.VoucherResponse;
import com.tth.RestaurantApplication.entity.MembershipTier;
import com.tth.RestaurantApplication.entity.PointTransaction;
import com.tth.RestaurantApplication.service.MembershipService;
import com.tth.RestaurantApplication.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminMembershipController {

    private final MembershipService membershipService;
    private final VoucherService voucherService;

    // ==================== MEMBERSHIP TIER APIs ====================

    @GetMapping("/membership-tiers")
    public ApiResponse<List<MembershipTier>> getAllTiers() {
        return ApiResponse.<List<MembershipTier>>builder()
                .result(membershipService.getAllTiers())
                .build();
    }

    @PostMapping("/membership-tiers")
    public ApiResponse<MembershipTier> createTier(@RequestBody MembershipTier tier) {
        return ApiResponse.<MembershipTier>builder()
                .result(membershipService.createTier(tier))
                .message("Membership tier created")
                .build();
    }

    @PutMapping("/membership-tiers/{tierId}")
    public ApiResponse<MembershipTier> updateTier(@PathVariable Integer tierId, @RequestBody MembershipTier tier) {
        return ApiResponse.<MembershipTier>builder()
                .result(membershipService.updateTier(tierId, tier))
                .message("Membership tier updated")
                .build();
    }

    @DeleteMapping("/membership-tiers/{tierId}")
    public ApiResponse<String> deleteTier(@PathVariable Integer tierId) {
        membershipService.deleteTier(tierId);
        return ApiResponse.<String>builder()
                .result("Membership tier deleted")
                .build();
    }

    // ==================== VOUCHER APIs ====================

    @GetMapping("/vouchers")
    public ApiResponse<List<VoucherResponse>> getAllVouchers() {
        return ApiResponse.<List<VoucherResponse>>builder()
                .result(voucherService.getAllVouchers())
                .build();
    }

    @PostMapping("/vouchers")
    public ApiResponse<VoucherResponse> createVoucher(@Valid @RequestBody VoucherCreateRequest request) {
        return ApiResponse.<VoucherResponse>builder()
                .result(voucherService.createVoucher(request))
                .message("Voucher created")
                .build();
    }

    @DeleteMapping("/vouchers/{voucherId}")
    public ApiResponse<String> deleteVoucher(@PathVariable Integer voucherId) {
        voucherService.deleteVoucher(voucherId);
        return ApiResponse.<String>builder()
                .result("Voucher deleted")
                .build();
    }

    // ==================== POINT MANAGEMENT APIs ====================

    @GetMapping("/points/report")
    public ApiResponse<List<PointTransaction>> getAllPointTransactions() {
        return ApiResponse.<List<PointTransaction>>builder()
                .result(membershipService.getAllPointTransactions())
                .build();
    }

    @PostMapping("/points/adjust")
    public ApiResponse<PointTransactionResponse> adjustPoints(@RequestBody AdjustPointsRequest request) {
        return ApiResponse.<PointTransactionResponse>builder()
                .result(voucherService.adjustPoints(request))
                .message("Points adjusted successfully")
                .build();
    }
}

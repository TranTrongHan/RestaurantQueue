package com.tth.RestaurantApplication.controller;

import com.tth.RestaurantApplication.dto.request.ApiResponse;
import com.tth.RestaurantApplication.dto.response.*;
import com.tth.RestaurantApplication.entity.MembershipHistory;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.service.AuthenticateService;
import com.tth.RestaurantApplication.service.MembershipService;
import com.tth.RestaurantApplication.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
@Slf4j
public class CustomerMembershipController {

    private final MembershipService membershipService;
    private final VoucherService voucherService;
    private final AuthenticateService authenticateService;

    /**
     * UC01 / UC04: Xem hạng, tổng chi tiêu, điểm hiện tại và tiến độ thăng hạng
     */
    @GetMapping("/membership/status")
    public ApiResponse<MembershipStatusResponse> getMembershipStatus() {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        return ApiResponse.<MembershipStatusResponse>builder()
                .result(membershipService.getMembershipStatus(currentUser))
                .build();
    }

    /**
     * UC04: Xem lịch sử thăng hạng
     */
    @GetMapping("/membership/history")
    public ApiResponse<List<MembershipHistory>> getMembershipHistory() {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        return ApiResponse.<List<MembershipHistory>>builder()
                .result(membershipService.getMembershipHistory(currentUser))
                .build();
    }

    /**
     * UC01 / UC04: Xem kho voucher cá nhân
     */
    @GetMapping("/vouchers/my-wallet")
    public ApiResponse<List<UserVoucherResponse>> getMyWallet() {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        return ApiResponse.<List<UserVoucherResponse>>builder()
                .result(voucherService.getMyWallet(currentUser))
                .build();
    }

    /**
     * Lấy chi tiết một voucher cụ thể trong kho
     */
    @GetMapping("/vouchers/{userVoucherId}")
    public ApiResponse<UserVoucherResponse> getUserVoucherDetail(@PathVariable Integer userVoucherId) {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        return ApiResponse.<UserVoucherResponse>builder()
                .result(voucherService.getUserVoucherDetail(currentUser, userVoucherId))
                .build();
    }

    /**
     * UC05: Xem danh sách voucher có thể đổi bằng điểm
     */
    @GetMapping("/vouchers/exchangeable")
    public ApiResponse<List<VoucherResponse>> getExchangeableVouchers() {
        return ApiResponse.<List<VoucherResponse>>builder()
                .result(voucherService.getExchangeableVouchers())
                .build();
    }

    /**
     * UC05: Đổi điểm lấy voucher
     */
    @PostMapping("/vouchers/redeem/{voucherId}")
    public ApiResponse<UserVoucherResponse> redeemVoucher(@PathVariable Integer voucherId) {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        return ApiResponse.<UserVoucherResponse>builder()
                .result(voucherService.redeemVoucher(currentUser, voucherId))
                .message("Voucher redeemed successfully")
                .build();
    }

    /**
     * UC03: Xem lịch sử tích/tiêu điểm
     */
    @GetMapping("/points/transactions")
    public ApiResponse<List<PointTransactionResponse>> getPointHistory() {
        User currentUser = authenticateService.getCurrentAuthenticatedUser();
        return ApiResponse.<List<PointTransactionResponse>>builder()
                .result(voucherService.getPointHistory(currentUser))
                .build();
    }
}

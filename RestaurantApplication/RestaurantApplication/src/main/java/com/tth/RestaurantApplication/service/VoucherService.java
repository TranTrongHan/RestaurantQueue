package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.request.AdjustPointsRequest;
import com.tth.RestaurantApplication.dto.request.VoucherCreateRequest;
import com.tth.RestaurantApplication.dto.response.*;
import com.tth.RestaurantApplication.entity.*;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class VoucherService {

    VoucherRepository voucherRepository;
    UserVoucherRepository userVoucherRepository;
    PointTransactionRepository pointTransactionRepository;
    MembershipTierRepository membershipTierRepository;
    UserRepository userRepository;

    // ==================== CUSTOMER APIs ====================

    /**
     * Lấy danh sách voucher trong ví của khách hàng
     */
    public List<UserVoucherResponse> getMyWallet(User user) {
        return userVoucherRepository.findByUserUserId(user.getUserId())
                .stream()
                .map(this::toUserVoucherResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách voucher có thể đổi bằng điểm
     */
    public List<VoucherResponse> getExchangeableVouchers() {
        return voucherRepository.findAll().stream()
                .filter(v -> v.getPointsRequired() != null && v.getPointsRequired() > 0)
                .filter(v -> v.getEndDate().isAfter(LocalDateTime.now()))
                .map(this::toVoucherResponse)
                .collect(Collectors.toList());
    }

    /**
     * Đổi điểm lấy voucher (UC05)
     */
    @Transactional
    public UserVoucherResponse redeemVoucher(User user, Integer voucherId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        // Kiểm tra đủ điểm
        if (user.getLoyaltyPoints() == null || user.getLoyaltyPoints() < voucher.getPointsRequired()) {
            throw new AppException(ErrorCode.INSUFFICIENT_POINTS);
        }

        // Kiểm tra voucher còn hạn
        if (voucher.getEndDate().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VOUCHER_EXPIRED);
        }

        // Trừ điểm
        int pointsToRedeem = voucher.getPointsRequired();
        user.setLoyaltyPoints(user.getLoyaltyPoints() - pointsToRedeem);
        userRepository.save(user);

        // Thêm voucher vào kho của khách
        UserVoucher userVoucher = UserVoucher.builder()
                .user(user)
                .voucher(voucher)
                .isUsed(false)
                .acquiredAt(LocalDateTime.now())
                .build();
        userVoucherRepository.save(userVoucher);

        // Ghi log điểm (REDEEM)
        PointTransaction tx = PointTransaction.builder()
                .user(user)
                .basePoints(0)
                .bonusPoints(0)
                .amount(-pointsToRedeem)
                .transactionType(PointTransaction.PointTransactionType.REDEEM)
                .description("Đổi " + pointsToRedeem + " điểm lấy voucher: " + voucher.getVoucherName())
                .userVoucher(userVoucher)
                .createdAt(LocalDateTime.now())
                .build();
        pointTransactionRepository.save(tx);

        log.info("User {} redeemed voucher {} for {} points", user.getUsername(), voucher.getVoucherCode(), pointsToRedeem);
        return toUserVoucherResponse(userVoucher);
    }

    /**
     * Xem lịch sử biến động điểm (UC03)
     */
    public List<PointTransactionResponse> getPointHistory(User user) {
        return pointTransactionRepository.findByUserUserIdOrderByCreatedAtDesc(user.getUserId())
                .stream()
                .map(this::toPointTransactionResponse)
                .collect(Collectors.toList());
    }

    // ==================== CHECKOUT LOGIC ====================

    /**
     * Validate voucher trước khi áp dụng vào đơn hàng (UC07)
     * @return Số tiền giảm thực tế
     */
    public BigDecimal validateAndCalculateDiscount(String voucherCode, BigDecimal orderValue, User user, Voucher.ApplyType orderType) {
        Voucher voucher = voucherRepository.findByVoucherCode(voucherCode)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();
        // Kiểm tra hạn dùng
        if (now.isBefore(voucher.getStartDate()) || now.isAfter(voucher.getEndDate())) {
            throw new AppException(ErrorCode.VOUCHER_EXPIRED);
        }

        // Kiểm tra giá trị đơn tối thiểu
        if (voucher.getMinOrderValue() != null && orderValue.compareTo(voucher.getMinOrderValue()) < 0) {
            throw new AppException(ErrorCode.VOUCHER_MIN_ORDER_NOT_MET);
        }

        // Kiểm tra loại đơn (ONLINE / DINE_IN / BOTH)
        if (voucher.getApplyType() != Voucher.ApplyType.BOTH && voucher.getApplyType() != orderType) {
            throw new AppException(ErrorCode.VOUCHER_APPLY_TYPE_MISMATCH);
        }

        // Kiểm tra hạng thành viên (nếu voucher yêu cầu hạng cụ thể)
        if (voucher.getTargetTier() != null) {
            if (user.getMembershipTier() == null ||
                    !user.getMembershipTier().getMinSpending().equals(voucher.getTargetTier().getMinSpending()) &&
                    user.getMembershipTier().getMinSpending().compareTo(voucher.getTargetTier().getMinSpending()) < 0) {
                throw new AppException(ErrorCode.VOUCHER_TIER_NOT_ELIGIBLE);
            }
        }

        // Tính toán số tiền giảm
        BigDecimal discount;
        if (voucher.getVoucherType() == Voucher.VoucherType.PERCENTAGE) {
            discount = orderValue.multiply(voucher.getDiscountValue()).divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN);
            // Áp dụng giới hạn tối đa
            if (voucher.getMaxDiscountAmount() != null && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discount = voucher.getMaxDiscountAmount();
            }
        } else {
            discount = voucher.getDiscountValue();
        }

        return discount;
    }

    /**
     * Gán voucher vào UserVoucher và đánh dấu đã dùng khi thanh toán thành công
     */
    @Transactional
    public UserVoucher markVoucherAsUsed(User user, String voucherCode) {
        UserVoucher userVoucher = userVoucherRepository.findByUserUserId(user.getUserId()).stream()
                .filter(uv -> uv.getVoucher().getVoucherCode().equals(voucherCode) && !uv.getIsUsed())
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.USER_VOUCHER_NOT_FOUND));

        userVoucher.setIsUsed(true);
        userVoucher.setUsedAt(LocalDateTime.now());
        return userVoucherRepository.save(userVoucher);
    }

    /**
     * Hoàn lại voucher khi thanh toán thất bại (UC06 - Rollback)
     */
    @Transactional
    public void rollbackVoucher(Integer userVoucherId) {
        UserVoucher userVoucher = userVoucherRepository.findById(userVoucherId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_VOUCHER_NOT_FOUND));
        userVoucher.setIsUsed(false);
        userVoucher.setUsedAt(null);
        userVoucherRepository.save(userVoucher);
        log.info("Rolled back voucher id={} for user={}", userVoucherId, userVoucher.getUser().getUsername());
    }

    // ==================== ADMIN APIs ====================

    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAll().stream().map(this::toVoucherResponse).collect(Collectors.toList());
    }

    @Transactional
    public VoucherResponse createVoucher(VoucherCreateRequest request) {
        MembershipTier targetTier = null;
        if (request.getTargetTierId() != null) {
            targetTier = membershipTierRepository.findById(request.getTargetTierId())
                    .orElseThrow(() -> new AppException(ErrorCode.MEMBERSHIP_TIER_NOT_FOUND));
        }

        Voucher voucher = Voucher.builder()
                .voucherCode(request.getVoucherCode())
                .voucherName(request.getVoucherName())
                .voucherType(request.getVoucherType())
                .discountValue(request.getDiscountValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .targetTier(targetTier)
                .isNewMemberVoucher(request.getIsNewMemberVoucher() != null ? request.getIsNewMemberVoucher() : false)
                .isLevelUpReward(request.getIsLevelUpReward() != null ? request.getIsLevelUpReward() : false)
                .pointsRequired(request.getPointsRequired() != null ? request.getPointsRequired() : 0)
                .applyType(request.getApplyType())
                .description(request.getDescription())
                .build();
        return toVoucherResponse(voucherRepository.save(voucher));
    }

    @Transactional
    public void deleteVoucher(Integer voucherId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));
        voucherRepository.delete(voucher);
    }

    /**
     * Điều chỉnh điểm thủ công cho khách hàng (Admin)
     */
    @Transactional
    public PointTransactionResponse adjustPoints(AdjustPointsRequest request) {
        User user = userRepository.findById(String.valueOf(request.getUserId()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        int currentPoints = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
        user.setLoyaltyPoints(currentPoints + request.getPoints());
        userRepository.save(user);

        PointTransaction tx = PointTransaction.builder()
                .user(user)
                .basePoints(0)
                .bonusPoints(0)
                .amount(request.getPoints())
                .transactionType(PointTransaction.PointTransactionType.ADJUST)
                .description("[ADMIN] " + request.getReason())
                .createdAt(LocalDateTime.now())
                .build();
        return toPointTransactionResponse(pointTransactionRepository.save(tx));
    }

    // ==================== PRIVATE HELPERS ====================

    private VoucherResponse toVoucherResponse(Voucher v) {
        return VoucherResponse.builder()
                .id(v.getId())
                .voucherCode(v.getVoucherCode())
                .voucherName(v.getVoucherName())
                .voucherType(v.getVoucherType())
                .discountValue(v.getDiscountValue())
                .maxDiscountAmount(v.getMaxDiscountAmount())
                .minOrderValue(v.getMinOrderValue())
                .startDate(v.getStartDate())
                .endDate(v.getEndDate())
                .targetTierName(v.getTargetTier() != null ? v.getTargetTier().getTierName() : null)
                .isNewMemberVoucher(v.getIsNewMemberVoucher())
                .isLevelUpReward(v.getIsLevelUpReward())
                .pointsRequired(v.getPointsRequired())
                .applyType(v.getApplyType())
                .description(v.getDescription())
                .build();
    }

    private UserVoucherResponse toUserVoucherResponse(UserVoucher uv) {
        return UserVoucherResponse.builder()
                .id(uv.getId())
                .voucher(toVoucherResponse(uv.getVoucher()))
                .isUsed(uv.getIsUsed())
                .acquiredAt(uv.getAcquiredAt())
                .usedAt(uv.getUsedAt())
                .build();
    }

    private PointTransactionResponse toPointTransactionResponse(PointTransaction tx) {
        return PointTransactionResponse.builder()
                .id(tx.getId())
                .basePoints(tx.getBasePoints())
                .bonusPoints(tx.getBonusPoints())
                .amount(tx.getAmount())
                .transactionType(tx.getTransactionType())
                .description(tx.getDescription())
                .billId(tx.getBill() != null ? tx.getBill().getBillId() : null)
                .createdAt(tx.getCreatedAt())
                .build();
    }
}

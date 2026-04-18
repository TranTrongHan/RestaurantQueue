package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.response.MembershipStatusResponse;
import com.tth.RestaurantApplication.dto.response.MembershipTierResponse;
import com.tth.RestaurantApplication.dto.response.PointTransactionResponse;
import com.tth.RestaurantApplication.entity.*;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.MembershipTierMapper;
import com.tth.RestaurantApplication.mapper.PointTransactionMapper;
import com.tth.RestaurantApplication.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MembershipService {
    private final UserRepository userRepository;
    private final MembershipTierRepository membershipTierRepository;
    private final MembershipHistoryRepository membershipHistoryRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final PointTransactionMapper pointTransactionMapper;
    private final MembershipTierMapper membershipTierMapper;
    private final SettingService settingService;

    // ==================== CUSTOMER APIs ====================

    /**
     * Lấy trạng thái hạng thành viên hiện tại của khách hàng (UC01)
     */
    public MembershipStatusResponse getMembershipStatus(User user) {
        MembershipTier currentTier = user.getMembershipTier();
        BigDecimal totalSpending = user.getTotalSpending() != null ? user.getTotalSpending() : BigDecimal.ZERO;

        // Tìm hạng tiếp theo
        List<MembershipTier> allTiers = membershipTierRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(MembershipTier::getMinSpending))
                .toList();

        BigDecimal nextTierMinSpending = null;
        BigDecimal spendingToNextTier = null;
        for (MembershipTier tier : allTiers) {
            if (currentTier == null || tier.getMinSpending().compareTo(currentTier.getMinSpending()) > 0) {
                nextTierMinSpending = tier.getMinSpending();
                spendingToNextTier = nextTierMinSpending.subtract(totalSpending);
                if (spendingToNextTier.compareTo(BigDecimal.ZERO) < 0)
                    spendingToNextTier = BigDecimal.ZERO;
                break;
            }
        }

        return MembershipStatusResponse.builder()
                .tierName(currentTier != null ? currentTier.getTierName() : "New Member")
                .pointEarningRate(currentTier != null ? currentTier.getPointEarningRate() : 1.0)
                .tierDescription(currentTier != null ? currentTier.getDescription() : null)
                .totalSpending(totalSpending)
                .loyaltyPoints(user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0)
                .nextTierMinSpending(nextTierMinSpending)
                .spendingToNextTier(spendingToNextTier)
                .build();
    }

    /**
     * Lịch sử thăng hạng của khách (UC04)
     */
    public List<MembershipHistory> getMembershipHistory(User user) {
        return membershipHistoryRepository.findByUserUserIdOrderByChangedAtDesc(user.getUserId());
    }

    // ==================== POST-PAYMENT PROCESSING ====================

    /**
     * Xử lý tích điểm và thăng hạng sau khi thanh toán thành công (UC03, UC04)
     * 
     * @param user       Người dùng
     * @param paidAmount Số tiền đã thanh toán (TotalAmount của Bill)
     * @param bill       Bill tương ứng
     */
    @Transactional
    public void processSuccessfulPayment(User user, BigDecimal paidAmount, Bill bill) {
        // 1. Cộng tổng chi tiêu
        BigDecimal currentSpending = user.getTotalSpending() != null ? user.getTotalSpending() : BigDecimal.ZERO;
        BigDecimal newTotalSpending = currentSpending.add(paidAmount);
        user.setTotalSpending(newTotalSpending);

        // 2. Tính và cộng điểm
        MembershipTier currentTier = user.getMembershipTier();
        double earningRate = currentTier != null ? currentTier.getPointEarningRate() : 1.0;

        BigDecimal pointsPerVndConfig = BigDecimal
                .valueOf(settingService.getIntegerSetting("LOYALTY_POINTS_PER_VND", 1000));
        int basePoints = paidAmount.divide(pointsPerVndConfig, 0, java.math.RoundingMode.DOWN).intValue();
        int bonusPoints = (int) (basePoints * (earningRate - 1.0));
        int totalNewPoints = basePoints + bonusPoints;

        int currentPoints = user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0;
        user.setLoyaltyPoints(currentPoints + totalNewPoints);

        // 3. Ghi log giao dịch điểm
        PointTransaction tx = PointTransaction.builder()
                .user(user)
                .basePoints(basePoints)
                .bonusPoints(bonusPoints)
                .amount(totalNewPoints)
                .transactionType(PointTransaction.PointTransactionType.EARN)
                .description(String.format("Tích %d điểm - %d gốc + %d thưởng (%s)", totalNewPoints, basePoints,
                        bonusPoints, currentTier != null ? currentTier.getTierName() : "New Member"))
                .bill(bill)
                .createdAt(LocalDateTime.now())
                .build();
        pointTransactionRepository.save(tx);

        // 4. Kiểm tra thăng hạng
        processRankUp(user, newTotalSpending, currentTier);

        userRepository.save(user);
        log.info("Processed payment for user={}, paid={}, +{}pts ({}base+{}bonus)", user.getUsername(), paidAmount,
                totalNewPoints, basePoints, bonusPoints);
    }

    /**
     * Kiểm tra và thực hiện thăng hạng nếu đủ điều kiện (UC04)
     */
    private void processRankUp(User user, BigDecimal totalSpending, MembershipTier currentTier) {
        // Lấy tất cả hạng theo thứ tự từ thấp đến cao
        List<MembershipTier> allTiers = membershipTierRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(MembershipTier::getMinSpending))
                .toList();

        // Tìm hạng cao nhất mà user đủ điều kiện
        MembershipTier bestEligibleTier = null;
        for (MembershipTier tier : allTiers) {
            if (totalSpending.compareTo(tier.getMinSpending()) >= 0) {
                bestEligibleTier = tier;
            }
        }

        // Nếu hạng mới cao hơn hạng hiện tại -> thăng hạng
        boolean shouldUpgrade = bestEligibleTier != null && (currentTier == null ||
                bestEligibleTier.getMinSpending().compareTo(currentTier.getMinSpending()) > 0);

        if (shouldUpgrade) {
            MembershipTier oldTier = user.getMembershipTier();
            user.setMembershipTier(bestEligibleTier);

            // Ghi lịch sử thăng hạng
            MembershipHistory history = MembershipHistory.builder()
                    .user(user)
                    .oldTier(oldTier)
                    .newTier(bestEligibleTier)
                    .changedAt(LocalDateTime.now())
                    .build();
            membershipHistoryRepository.save(history);

            // Tặng voucher thăng hạng (nếu có)
            grantLevelUpVoucher(user, bestEligibleTier);

            log.info("User {} upgraded to tier: {}", user.getUsername(), bestEligibleTier.getTierName());
        }
    }

    /**
     * Gán Voucher khi thăng hạng (UC04) hoặc khi là thành viên mới (UC01)
     */
    @Transactional
    public void grantWelcomeVoucher(User user) {
        voucherRepository.findAll().stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsNewMemberVoucher()))
                .filter(v -> v.getEndDate().isAfter(LocalDateTime.now()))
                .forEach(v -> addVoucherToWallet(user, v, "Quà tặng thành viên mới"));
    }

    private void grantLevelUpVoucher(User user, MembershipTier newTier) {
        voucherRepository.findAll().stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsLevelUpReward()))
                .filter(v -> v.getTargetTier() != null && v.getTargetTier().getId().equals(newTier.getId()))
                .filter(v -> v.getEndDate().isAfter(LocalDateTime.now()))
                .forEach(v -> addVoucherToWallet(user, v, "Quà tặng thăng hạng " + newTier.getTierName()));
    }

    private void addVoucherToWallet(User user, Voucher voucher, String logMessage) {
        UserVoucher uv = UserVoucher.builder()
                .user(user)
                .voucher(voucher)
                .isUsed(false)
                .acquiredAt(LocalDateTime.now())
                .build();
        userVoucherRepository.save(uv);
        log.info("{} -> user={}, voucher={}", logMessage, user.getUsername(), voucher.getVoucherCode());
    }

    // ==================== ADMIN APIs ====================

    public List<MembershipTierResponse> getAllTiers() {
        return membershipTierRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(MembershipTier::getMinSpending))
                .map(membershipTierMapper::toMembershipTierResponse)
                .toList();
    }

    @Transactional
    public MembershipTierResponse createTier(MembershipTier tier) {
        return membershipTierMapper.toMembershipTierResponse(membershipTierRepository.save(tier));
    }

    @Transactional
    public MembershipTierResponse updateTier(Integer tierId, MembershipTier request) {
        MembershipTier tier = membershipTierRepository.findById(tierId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBERSHIP_TIER_NOT_FOUND));
        if (request.getTierName() != null)
            tier.setTierName(request.getTierName());
        if (request.getMinSpending() != null)
            tier.setMinSpending(request.getMinSpending());
        if (request.getPointEarningRate() != null)
            tier.setPointEarningRate(request.getPointEarningRate());
        if (request.getDescription() != null)
            tier.setDescription(request.getDescription());
        return membershipTierMapper.toMembershipTierResponse(membershipTierRepository.save(tier));
    }

    @Transactional
    public void deleteTier(Integer tierId) {
        MembershipTier tier = membershipTierRepository.findById(tierId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBERSHIP_TIER_NOT_FOUND));
        membershipTierRepository.delete(tier);
    }

    /**
     * Admin xem toàn bộ lịch sử giao dịch điểm
     */
    public List<PointTransactionResponse> getAllPointTransactions() {
        return pointTransactionRepository.findAll().stream()
                .map(pointTransactionMapper::toPointTransactionResponse)
                .toList();
    }
}

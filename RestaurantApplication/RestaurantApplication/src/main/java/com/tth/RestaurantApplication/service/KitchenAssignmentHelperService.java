package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.response.KitchenAssignmentResponse;
import com.tth.RestaurantApplication.entity.Chef;
import com.tth.RestaurantApplication.entity.KitchenAssignment;
import com.tth.RestaurantApplication.entity.OrderItem;
import com.tth.RestaurantApplication.entity.TableEntity;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.ChefMapper;
import com.tth.RestaurantApplication.mapper.KitchenAssignmentMapper;
import com.tth.RestaurantApplication.mapper.OrderItemMapper;
import com.tth.RestaurantApplication.repository.ChefRepository;
import com.tth.RestaurantApplication.repository.KitchenAssignmentRepository;
import com.tth.RestaurantApplication.repository.OrderItemRepository;
import com.tth.RestaurantApplication.repository.TableRepository;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class KitchenAssignmentHelperService {
    OrderItemRepository orderItemRepository;
    ChefRepository chefRepository;
    KitchenAssignmentRepository kitchenAssignmentRepository;
    FirestoreService firestoreService;
    MenuItemService menuItemService;
    OrderItemMapper orderItemMapper;
    ChefMapper chefMapper;
    KitchenAssignmentMapper kitchenAssignmentMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public KitchenAssignmentResponse assignToChef(Integer orderItemId, Integer chefId) throws Exception {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND));
//        log.info("orderItemId nhận được: {}",orderItemId);
        Chef chef = chefRepository.findById(chefId).orElseThrow(() -> new AppException(ErrorCode.KITCHEN_ASSIGN_NOT_FOUND));
//        log.info("chefId: {}",chef.getUserId());
//        log.info("chef rảnh: {}", chef.getUser().getUserId());
        KitchenAssignment assignment = new KitchenAssignment();
        assignment.setChef(chef);
        assignment.setOrderItem(orderItem);
        assignment.setStartAt(LocalDateTime.now());
        assignment.setStatus(KitchenAssignment.KitchenAssignmentStatus.COOKING);
        double avgTime = menuItemService.getAvgCookingTime(orderItem.getMenuItem().getMenuItemId());
        assignment.setDeadlineTime(LocalDateTime.now().plusMinutes((long) avgTime ));

//        orderItem.setDeadlineTime(LocalDateTime.now().plusMinutes((long) avgTime ));
//        orderItemRepository.save(orderItem);
//        firestoreService.updateDeadlineTime(orderItem,LocalDateTime.now().plusMinutes((long) avgTime));
//        log.info("đã cập nhật deadlineTime thực tế cho orderItem {}",orderItem.getOrderItemId());
        assignment = kitchenAssignmentRepository.save(assignment);
//        log.info("đã lưu assignment{}", assignment.getKitchenAssignId());
        firestoreService.pushKitchenAssignment(assignment,orderItem);
        orderItem.setStatus(OrderItem.OrderItemStatus.COOKING);
        orderItemRepository.save(orderItem);
//        log.info("cập nhật {} cooking",orderItem.getOrderItemId());
        firestoreService.updateOrderItemField(String.valueOf(orderItem.getOrder().getOrderId()),String.valueOf(orderItem.getOrderItemId()),"status", OrderItem.OrderItemStatus.COOKING.toString());
        chef.setIsAvailable(false);
        chefRepository.save(chef);
//        log.info("đã cập nhật trạng thái chef {}",chef.getUser().getUserId());

        return kitchenAssignmentMapper.toKitchenAssignmentResponse(assignment);

    }
    /**
     * Tính deadlineTime cho một orderItem dựa trên queue của Chef.
     */
    // Chỉ hữu dụng trong case các món ăn đều đang chờ được bếp nấu
    // Trong trường hợp hiện tại thì ước lượng deadline = now + avgCookingTime của món
    public LocalDateTime calculateETAForChef(Chef chef, OrderItem orderItem) {
        double avgTime = menuItemService.getAvgCookingTime(orderItem.getMenuItem().getMenuItemId());

        // Tìm assignment gần nhất của chef này (món đang nấu)
        Optional<KitchenAssignment> lastAssignment = kitchenAssignmentRepository
                .findTopByChefAndStatusOrderByStartAtDesc(
                        chef, KitchenAssignment.KitchenAssignmentStatus.COOKING
                );

        if (lastAssignment.isPresent()) {
            KitchenAssignment last = lastAssignment.get();
            double lastAvg = menuItemService.getAvgCookingTime(
                    last.getOrderItem().getMenuItem().getMenuItemId()
            );
            LocalDateTime lastFinish = last.getStartAt().plusMinutes((long) lastAvg);
            return lastFinish.plusMinutes((long) avgTime);
        } else {
            // Nếu chef rảnh thì ETA = bây giờ + selfCookingTime
            return LocalDateTime.now().plusMinutes((long) avgTime);
        }
    }
    // Khong de logic nay trong kitchenService hay OrderSession service, vi se gay ra vong lap phu thuoc
    //  OrderSession service dang inject kitchenService, kitchenService khong  dc inject lai OrderSessionService
    public double calculateEstimatedTime(int menuItemId) {
        log.info("call calculateEstimatedTime");
        int totalChefs = (int) chefRepository.count();
        // Thời gian còn lại của các món đang nấu
        List<Double> cookingRemainingTimes = kitchenAssignmentRepository
                .findByStatus(KitchenAssignment.KitchenAssignmentStatus.COOKING)
                .stream()
                .map(item -> {
                    double avg = menuItemService.getAvgCookingTime(item.getOrderItem().getMenuItem().getMenuItemId());
                    double elapsed = Duration.between(item.getStartAt(), LocalDateTime.now()).toMinutes();
                    double remaining = Math.max(0, avg - elapsed);
                    remaining = BigDecimal.valueOf(remaining)
                            .setScale(1, RoundingMode.HALF_UP)
                            .doubleValue();
                    log.info("Cooking item {} avg={} elapsed={} → remaining={}",
                            item.getOrderItem().getMenuItem().getMenuItemId(),
                            avg, elapsed, remaining);
                    return remaining;
                })
                .toList();

        // Nếu có nhiều món đang nấu -> lấy max (món lâu nhất)
        double cookingTime = cookingRemainingTimes.stream()
                .mapToDouble(Double::doubleValue)
                .max()
                .orElse(0);
        log.info("Max cooking remaining time: {}", cookingTime);
        // Tổng thời gian trung bình các món đang chờ
        double pendingTimeTotal = orderItemRepository.findByStatus(OrderItem.OrderItemStatus.PENDING)
                .stream()
                .mapToDouble(item -> {
                    double avg = menuItemService.getAvgCookingTime(item.getMenuItem().getMenuItemId());
                    log.info("Pending item {} avg={}", item.getMenuItem().getMenuItemId(), avg);
                    return avg;
                })
                .sum();
        log.info("Total pending time (before adjust): {}", pendingTimeTotal);
        // Chia đều pending cho số chef (giả định load balancing)
        double adjustedPendingTime = pendingTimeTotal / totalChefs;
        log.info("Adjusted pending time (÷ {} chefs): {}", totalChefs, adjustedPendingTime);
        // Thời gian nấu trung bình của món hiện tại
        double selfCookingTime = menuItemService.getAvgCookingTime(menuItemId);
        log.info("Self cooking time (menuItemId={}): {}", menuItemId, selfCookingTime);
        // Công thức cuối
        double estimatedTime = cookingTime + adjustedPendingTime + selfCookingTime;
        log.info("Estimated total time for menuItemId {}: {}", menuItemId, estimatedTime);

        return estimatedTime;
    }
}

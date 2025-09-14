package com.tth.RestaurantApplication;

import com.tth.RestaurantApplication.entity.KitchenAssignment;
import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.entity.OrderItem;
import com.tth.RestaurantApplication.repository.ChefRepository;
import com.tth.RestaurantApplication.repository.KitchenAssignmentRepository;
import com.tth.RestaurantApplication.repository.OrderItemRepository;
import com.tth.RestaurantApplication.service.KitchenAssignmentHelperService;
import com.tth.RestaurantApplication.service.MenuItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.IntStream;

import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
public class EstimatedTimeCalculatorTest {

    @InjectMocks
    private KitchenAssignmentHelperService kitchenAssignmentHelperService;
    @Mock
    private ChefRepository chefRepository;
    @Mock
    private KitchenAssignmentRepository kitchenAssignmentRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private MenuItemService menuItemService;

    private final int TOTAL_CHEFS = 13;
    private final int TARGET_MENU_ITEM_ID = 99;
    private final double TARGET_COOKING_TIME = 15.0;

    @BeforeEach
    void setUp() {
        // Set up common mock behaviors
        lenient().when(chefRepository.count()).thenReturn((long) TOTAL_CHEFS);
        lenient().when(menuItemService.getAvgCookingTime(TARGET_MENU_ITEM_ID)).thenReturn(TARGET_COOKING_TIME);
    }
    
    // --- High-traffic scenario test ---
    @Test
    @DisplayName("Nên tính thời gian dự kiến chính xác trong giờ cao điểm với nhiều món đang chờ và nhiều đầu bếp")
    void shouldCalculateAccurateEstimateTime_whenHighTraffic() {
        // Arrange
        KitchenAssignment cookingItem1 = createKitchenAssignment(1, 45, 35);
        KitchenAssignment cookingItem2 = createKitchenAssignment(2, 20, 10);
        KitchenAssignment cookingItem3 = createKitchenAssignment(3, 30, 20);

        // Món đang chờ: 30 món
        List<OrderItem> pendingItems = IntStream.range(0, 30)
                .mapToObj(i -> {
                    OrderItem orderItem = new OrderItem();
                    MenuItem menuItem = new MenuItem();
                    menuItem.setMenuItemId(i + 100);
                    orderItem.setMenuItem(menuItem);
                    return orderItem;
                })
                .toList();

        when(kitchenAssignmentRepository.findByStatus(KitchenAssignment.KitchenAssignmentStatus.COOKING))
                .thenReturn(List.of(cookingItem1, cookingItem2, cookingItem3));

        when(orderItemRepository.findByStatus(OrderItem.OrderItemStatus.PENDING))
                .thenReturn(pendingItems);

        // Sửa lỗi: Sử dụng anyInt() và các giá trị Integer
        when(menuItemService.getAvgCookingTime(anyInt())).thenReturn(10.0);
        when(menuItemService.getAvgCookingTime(1)).thenReturn(45.0);
        when(menuItemService.getAvgCookingTime(2)).thenReturn(20.0);
        when(menuItemService.getAvgCookingTime(3)).thenReturn(30.0);
        when(menuItemService.getAvgCookingTime(TARGET_MENU_ITEM_ID)).thenReturn(TARGET_COOKING_TIME);

        // Act
        double estimatedTime = kitchenAssignmentHelperService.calculateEstimatedTime(TARGET_MENU_ITEM_ID);

        // Assert
        assertThat(estimatedTime).isEqualTo(48.07692307692308);
    }



    private KitchenAssignment createKitchenAssignment(long orderItemId, double avgCookingTime, double elapsedMinutes) {
        KitchenAssignment assignment = new KitchenAssignment();
        assignment.setStatus(KitchenAssignment.KitchenAssignmentStatus.COOKING);
        assignment.setStartAt(LocalDateTime.now().minusMinutes((long) elapsedMinutes));

        OrderItem orderItem = new OrderItem();
        MenuItem menuItem = new MenuItem();
        menuItem.setMenuItemId((int)orderItemId);
        orderItem.setMenuItem(menuItem);

        assignment.setOrderItem(orderItem);

        // The specific stubbing for avgCookingTime is now moved to the test method itself
        // to avoid conflicts with the more general anyLong() stubbing.
        return assignment;
    }

    private OrderItem createPendingOrderItem(int menuItemId, double avgCookingTime) {
        OrderItem orderItem = new OrderItem();
        orderItem.setStatus(OrderItem.OrderItemStatus.PENDING);
        MenuItem menuItem = new MenuItem();
        menuItem.setMenuItemId(menuItemId);
        orderItem.setMenuItem(menuItem);
        lenient().when(menuItemService.getAvgCookingTime(menuItemId)).thenReturn(avgCookingTime);
        return orderItem;
    }
    // Trường hợp 1: Không có món nào đang nấu hoặc đang chờ
    @Test
    @DisplayName("Nên chỉ tính thời gian nấu của món hiện tại khi bếp rỗng")
    void shouldCalculateOnlySelfCookingTime_whenKitchenIsEmpty() {
        // Arrange
        when(kitchenAssignmentRepository.findByStatus(KitchenAssignment.KitchenAssignmentStatus.COOKING))
                .thenReturn(Collections.emptyList());
        when(orderItemRepository.findByStatus(OrderItem.OrderItemStatus.PENDING))
                .thenReturn(Collections.emptyList());

        // Act
        double estimatedTime = kitchenAssignmentHelperService.calculateEstimatedTime(TARGET_MENU_ITEM_ID);

        // Assert
        // estimatedTime = 0 (max_cooking_time) + 0 (pending_time) + 15 (self_cooking_time)
        assertThat(estimatedTime).isEqualTo(15.0);
    }
    // Trường hợp 2: Có món đang nấu nhưng không có món đang chờ
    @Test
    @DisplayName("Nên tính thời gian còn lại của món đang nấu và thời gian nấu của món hiện tại")
    void shouldCalculateEstimatedTime_whenNoPendingItems() {
        // Arrange
        KitchenAssignment cookingItem = createKitchenAssignment(1, 20, 10); // Remaining: 10 mins

        when(kitchenAssignmentRepository.findByStatus(KitchenAssignment.KitchenAssignmentStatus.COOKING))
                .thenReturn(List.of(cookingItem));
        when(orderItemRepository.findByStatus(OrderItem.OrderItemStatus.PENDING))
                .thenReturn(Collections.emptyList());

        when(menuItemService.getAvgCookingTime(1)).thenReturn(20.0);

        // Act
        double estimatedTime = kitchenAssignmentHelperService.calculateEstimatedTime(TARGET_MENU_ITEM_ID);

        // Assert
        // estimatedTime = 10 (max_cooking_time) + 0 (pending_time) + 15 (self_cooking_time)
        assertThat(estimatedTime).isEqualTo(25.0);
    }
    // Trường hợp 3: Thời gian đã nấu vượt quá thời gian trung bình
    @Test
    @DisplayName("Thời gian còn lại của món đang nấu phải là 0 nếu thời gian đã trôi qua lớn hơn thời gian nấu trung bình")
    void shouldReturnZeroForRemainingTime_whenElapsedTimeExceedsAvgTime() {
        // Arrange
        KitchenAssignment cookingItem = createKitchenAssignment(1, 20, 25); // Elapsed: 25 mins > Avg: 20 mins

        when(kitchenAssignmentRepository.findByStatus(KitchenAssignment.KitchenAssignmentStatus.COOKING))
                .thenReturn(List.of(cookingItem));
        when(orderItemRepository.findByStatus(OrderItem.OrderItemStatus.PENDING))
                .thenReturn(Collections.emptyList());

        when(menuItemService.getAvgCookingTime(1)).thenReturn(20.0);

        // Act
        double estimatedTime = kitchenAssignmentHelperService.calculateEstimatedTime(TARGET_MENU_ITEM_ID);

        // Assert
        // estimatedTime = 0 (max_cooking_time) + 0 (pending_time) + 15 (self_cooking_time)
        assertThat(estimatedTime).isEqualTo(15.0);
    }

    @Test
    @DisplayName("Nên tính thời gian dự kiến chính xác khi có lượng lớn món chờ")
    void shouldCalculateAccurateEstimateTime_whenLargeNumberOfPendingItems() {
        // Arrange
        when(kitchenAssignmentRepository.findByStatus(KitchenAssignment.KitchenAssignmentStatus.COOKING))
                .thenReturn(Collections.emptyList());

        // 50 món đang chờ, mỗi món 10 phút
        List<OrderItem> pendingItems = IntStream.range(0, 50)
                .mapToObj(i -> {
                    OrderItem orderItem = new OrderItem();
                    MenuItem menuItem = new MenuItem();
                    menuItem.setMenuItemId(i + 200);
                    orderItem.setMenuItem(menuItem);
                    return orderItem;
                })
                .toList();

        when(orderItemRepository.findByStatus(OrderItem.OrderItemStatus.PENDING))
                .thenReturn(pendingItems);

        // FIX: Set the specific stubbing for TARGET_MENU_ITEM_ID AFTER the general stubbing.
        // This ensures that the general stubbing does not override the specific one.
        when(menuItemService.getAvgCookingTime(anyInt())).thenReturn(10.0);
        when(menuItemService.getAvgCookingTime(TARGET_MENU_ITEM_ID)).thenReturn(TARGET_COOKING_TIME);

        // Act
        double estimatedTime = kitchenAssignmentHelperService.calculateEstimatedTime(TARGET_MENU_ITEM_ID);

        // Assert
        // estimatedTime = 0 (max_cooking_time) + (50 * 10 / 13) + 15 (self_cooking_time)
        double expectedTime = 0.0 + (500.0 / 13.0) + TARGET_COOKING_TIME;
        assertThat(estimatedTime).isEqualTo(expectedTime);
    }
}

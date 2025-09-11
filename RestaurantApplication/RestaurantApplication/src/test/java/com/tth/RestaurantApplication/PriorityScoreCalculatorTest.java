package com.tth.RestaurantApplication;

import com.tth.RestaurantApplication.entity.*;
import com.tth.RestaurantApplication.service.MenuItemService;
import com.tth.RestaurantApplication.service.OrderSessionService;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@ExtendWith(MockitoExtension.class)
@Slf4j
public class PriorityScoreCalculatorTest {
    @Mock
    private MenuItemService menuItemService;

    @InjectMocks
    private OrderSessionService orderSessionService;

    private User vipUser;
    private User regularUser;
    private OrderItem vipOrderItem;
    private OrderItem regularOrderItem;
    private MenuItem complexMenuItem;
    private MenuItem simpleMenuItem;
    private Order order;
    private OrderSession orderSession;
    private Reservation vipReservation;
    private Reservation regularReservation;
    @BeforeEach
    void setUp(){

        vipUser = new User();
        vipUser.setIsVip(true);

        regularUser = new User();
        regularUser.setIsVip(false);


        complexMenuItem = new MenuItem();
        complexMenuItem.setMenuItemId(1);

        simpleMenuItem = new MenuItem();
        simpleMenuItem.setMenuItemId(2);

        // Chuẩn bị các OrderItem với dữ liệu thật
        // OrderItem của khách VIP, món phức tạp, đã chờ 30 phút
        vipOrderItem = new OrderItem();
        vipOrderItem.setMenuItem(complexMenuItem);


        order = new Order();
        orderSession = new OrderSession();
        vipReservation = new Reservation();
        vipReservation.setUser(vipUser);
        orderSession.setReservation(vipReservation);
        vipOrderItem.setOrder(order);
        order.setOrderSession(orderSession);

        // OrderItem của khách thường, món đơn giản, vừa mới order
        regularOrderItem = new OrderItem();
        regularOrderItem.setMenuItem(simpleMenuItem);


        regularReservation = new Reservation();
        regularReservation.setUser(regularUser);

        Order regularOrder = new Order();
        OrderSession regularOrderSession = new OrderSession();
        regularOrderSession.setReservation(regularReservation);
        regularOrderItem.setOrder(regularOrder);
        regularOrder.setOrderSession(regularOrderSession);

    }
    @Test
    @DisplayName("Nên tính điểm ưu tiên cao cho món của khách VIP, đã chờ lâu và phức tạp")
    void shouldCalculateHighPriorityScoreForVIPLongWaitingComplexItem() {
        // Arrange
        vipOrderItem.setStartTime(LocalDateTime.now().minusMinutes(30));
        when(menuItemService.getAvgCookingTime(complexMenuItem.getMenuItemId())).thenReturn(45.0);

        // Act
        double calculatedScore = orderSessionService.calculatePriorityScore(vipOrderItem);

        // Assert
        double expectedScore = BigDecimal.valueOf(27.5).setScale(2, RoundingMode.HALF_UP).doubleValue();
        assertThat(calculatedScore).isEqualTo(expectedScore);
    }
    @Test
    @DisplayName("Nên tính điểm ưu tiên thấp (cao) cho món của khách thường, vừa order và đơn giản")
    void shouldCalculateLowPriorityScoreForNormalCustomerNewSimpleItem() {
        // Arrange
        regularOrderItem.setStartTime(LocalDateTime.now());
        when(menuItemService.getAvgCookingTime(simpleMenuItem.getMenuItemId())).thenReturn(5.0);

        // Act
        double calculatedScore = orderSessionService.calculatePriorityScore(regularOrderItem);

        // Assert
        double expectedScore = BigDecimal.valueOf(97.5).setScale(2, RoundingMode.HALF_UP).doubleValue();
        assertThat(calculatedScore).isEqualTo(expectedScore);
    }

    @Test
    @DisplayName("Nên giảm điểm ưu tiên cho món ăn đã chờ 5 phút")
    void shouldDecreasePriorityScoreForFiveMinutesWaitingItem() {
        // Arrange
        // Giả lập thời gian nấu trung bình cho món ăn
        regularOrderItem.setStartTime(LocalDateTime.now().minusMinutes(5));
        when(menuItemService.getAvgCookingTime(simpleMenuItem.getMenuItemId())).thenReturn(10.0);


        // Act
        double calculatedScore = orderSessionService.calculatePriorityScore(regularOrderItem);

        // Assert
        // Tính điểm mong đợi: 100 (Base) - 0 (VIP) - 5 (Chờ) - (10 * 0.5) (Nấu) = 90
        double expectedScore = BigDecimal.valueOf(90.0).setScale(2, RoundingMode.HALF_UP).doubleValue();
        assertThat(calculatedScore).isEqualTo(expectedScore);
    }

    @Test
    @DisplayName("Nên giảm mạnh điểm ưu tiên cho món ăn đã chờ 30 phút")
    void shouldStronglyDecreasePriorityScoreForThirtyMinutesWaitingItem() {
        // Arrange
        // Giả lập thời gian nấu trung bình cho món ăn
        regularOrderItem.setStartTime(LocalDateTime.now().minusMinutes(30));
        when(menuItemService.getAvgCookingTime(simpleMenuItem.getMenuItemId())).thenReturn(10.0);

        // Chuẩn bị dữ liệu cho món ăn của khách thường, đã chờ 30 phút
        regularOrderItem.setStartTime(LocalDateTime.now().minusMinutes(30));

        // Act
        double calculatedScore = orderSessionService.calculatePriorityScore(regularOrderItem);

        // Assert
        // Tính điểm mong đợi: 100 (Base) - 0 (VIP) - 30 (Chờ) - (10 * 0.5) (Nấu) = 65
        double expectedScore = BigDecimal.valueOf(65.0).setScale(2, RoundingMode.HALF_UP).doubleValue();
        assertThat(calculatedScore).isEqualTo(expectedScore);
    }
    @Test
    @DisplayName("Nên giảm mạnh điểm ưu tiên cho món ăn đã chờ 60 phút (tối đa)")
    void shouldCalculateVeryHighPriorityScoreForSixtyMinutesWaitingItem() {
        // Arrange
        // Giả lập thời gian nấu trung bình cho món ăn
        when(menuItemService.getAvgCookingTime(simpleMenuItem.getMenuItemId())).thenReturn(10.0);

        // Đặt thời gian bắt đầu là 60 phút trong quá khứ
        regularOrderItem.setStartTime(LocalDateTime.now().minusMinutes(60));

        // Act
        double calculatedScore = orderSessionService.calculatePriorityScore(regularOrderItem);

        // Assert
        // Tính điểm mong đợi: 100 (Base) - 0 (VIP) - 60 (Chờ) - (10 * 0.5) (Nấu) = 35
        double expectedScore = BigDecimal.valueOf(35.0).setScale(2, RoundingMode.HALF_UP).doubleValue();
        assertThat(calculatedScore).isEqualTo(expectedScore);
    }
    @Test
    @DisplayName("Nên có điểm ưu tiên thấp cho món ăn nấu nhanh ")
    void shouldCalculateLowPriorityScoreForFastCookingItem() {
        // Arrange
        // Giả lập thời gian nấu rất nhanh: 2 phút
        regularOrderItem.setStartTime(LocalDateTime.now());
        when(menuItemService.getAvgCookingTime(simpleMenuItem.getMenuItemId())).thenReturn(2.0);



        double calculatedScore = orderSessionService.calculatePriorityScore(regularOrderItem);

        // Assert
        // Tính điểm mong đợi: 100 (Base) - 0 (VIP) - 0 (Chờ) - (2 * 0.5) (Nấu) = 99
        double expectedScore = BigDecimal.valueOf(99.0).setScale(2, RoundingMode.HALF_UP).doubleValue();
        assertThat(calculatedScore).isEqualTo(expectedScore);
    }

    @Test
    @DisplayName("Nên có điểm ưu tiên cao cho món ăn nấu lâu ")
    void shouldCalculateHighPriorityScoreForLongCookingItem() {
        // Arrange
        // Giả lập thời gian nấu rất lâu: 15 phút
        regularOrderItem.setStartTime(LocalDateTime.now());
        when(menuItemService.getAvgCookingTime(simpleMenuItem.getMenuItemId())).thenReturn(15.0);

        // Act

        double calculatedScore = orderSessionService.calculatePriorityScore(regularOrderItem);

        // Assert
        // Tính điểm mong đợi: 100 (Base) - 0 (VIP) - 0 (Chờ) - (15 * 0.5) (Nấu) = 92.5
        double expectedScore = BigDecimal.valueOf(92.5).setScale(2, RoundingMode.HALF_UP).doubleValue();
        assertThat(calculatedScore).isEqualTo(expectedScore);
    }

}

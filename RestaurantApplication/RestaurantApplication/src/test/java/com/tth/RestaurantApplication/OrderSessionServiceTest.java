package com.tth.RestaurantApplication;


import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.entity.OrderItem;
import com.tth.RestaurantApplication.service.MenuItemService;
import com.tth.RestaurantApplication.service.OrderSessionService;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
@ActiveProfiles("test")
public class OrderSessionServiceTest {
    @InjectMocks
    OrderSessionService orderSessionService;

    @Mock
    MenuItemService menuItemService;

    OrderItem orderItem;
    MenuItem menuItem;
    @BeforeEach
    void setUp(){

    }
}

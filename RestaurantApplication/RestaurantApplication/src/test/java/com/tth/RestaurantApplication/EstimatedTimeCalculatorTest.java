package com.tth.RestaurantApplication;

import com.tth.RestaurantApplication.repository.ChefRepository;
import com.tth.RestaurantApplication.repository.KitchenAssignmentRepository;
import com.tth.RestaurantApplication.repository.OrderItemRepository;
import com.tth.RestaurantApplication.service.KitchenAssignmentHelperService;
import com.tth.RestaurantApplication.service.MenuItemService;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
}

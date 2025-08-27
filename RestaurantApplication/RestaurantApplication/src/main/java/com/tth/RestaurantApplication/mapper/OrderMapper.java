package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.OrderResponse;
import com.tth.RestaurantApplication.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Optional;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(source = "order.orderItems",target = "items")
//    @Mapping(source = "onlineOrder" , target = "onlineOrder")
    OrderResponse toOrderResponse(Order order);
}

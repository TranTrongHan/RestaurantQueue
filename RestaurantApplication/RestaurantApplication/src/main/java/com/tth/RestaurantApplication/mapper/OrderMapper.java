package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.OrderResponse;
import com.tth.RestaurantApplication.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Optional;

@Mapper(componentModel = "spring",uses = {ReservationMapper.class})
public interface OrderMapper {
    @Mapping(source = "orderItems",target = "items")
    @Mapping(source = "orderSession.reservation" , target = "reservationResponse")
    OrderResponse toOrderResponse(Order order);
}

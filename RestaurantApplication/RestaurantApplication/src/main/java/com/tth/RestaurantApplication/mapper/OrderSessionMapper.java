package com.tth.RestaurantApplication.mapper;


import com.tth.RestaurantApplication.dto.response.OrderSessionResponse;
import com.tth.RestaurantApplication.entity.OrderSession;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring",uses = {OrderMapper.class, ReservationMapper.class})
public interface OrderSessionMapper {
    @Mapping(source = "reservation",target = "reservationResponse")
    @Mapping(source = "order",target = "order")
    OrderSessionResponse toOrderSessionResponse(OrderSession orderSession);
}

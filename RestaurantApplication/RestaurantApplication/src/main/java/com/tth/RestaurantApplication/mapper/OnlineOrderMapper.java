package com.tth.RestaurantApplication.mapper;


import com.tth.RestaurantApplication.dto.response.OnlineOrderResponse;
import com.tth.RestaurantApplication.entity.OnlineOrder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {CustomerMapper.class,OrderItemMapper.class})
public interface OnlineOrderMapper {
    @Mapping(source = "order.orderId",target = "orderId")
    @Mapping(source = "user", target = "customer")
    @Mapping(source = "order.orderItems",target = "orderItems")
    OnlineOrderResponse toOnlineOrderResponse(OnlineOrder onlineOrder);
}

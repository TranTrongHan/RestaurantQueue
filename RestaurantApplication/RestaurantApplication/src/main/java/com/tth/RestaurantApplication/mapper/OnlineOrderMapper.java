package com.tth.RestaurantApplication.mapper;


import com.tth.RestaurantApplication.dto.response.OnlineOrderResponse;
import com.tth.RestaurantApplication.entity.OnlineOrder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {CustomerMapper.class,OrderItemMapper.class})
public interface OnlineOrderMapper {
    @Mapping(source = "order.orderId",target = "orderId")
    @Mapping(source = "user", target = "customer")
    @Mapping(source = "order.orderItems", target = "orderItems")
    @Mapping(source = "order.bill.subTotal", target = "subTotal")
    @Mapping(source = "order.bill.discountAmount", target = "discountAmount")
    @Mapping(source = "order.bill.totalAmount", target = "totalAmount")
    @Mapping(source = "order.status", target = "status")
    OnlineOrderResponse toOnlineOrderResponse(OnlineOrder onlineOrder);
}

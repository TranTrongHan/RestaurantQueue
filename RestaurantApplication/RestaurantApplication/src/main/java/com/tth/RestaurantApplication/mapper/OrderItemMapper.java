package com.tth.RestaurantApplication.mapper;


import com.tth.RestaurantApplication.dto.response.OrderItemResponse;
import com.tth.RestaurantApplication.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring",uses = {MenuItemMapper.class})
public interface OrderItemMapper {
    @Mapping(source = "menuItem.name",target = "name")
    @Mapping(source = "menuItem.image", target = "image")
    @Mapping(source = "menuItem.price", target = "price")
    @Mapping(source = "status" ,target = "orderItemStatus")
    @Mapping(source = "priorityScore" ,target = "priorityScore")
    @Mapping(source = "order.orderId",target = "orderId")
    @Mapping(source = "deadlineTime",target = "expectedDeadlineTime")
    OrderItemResponse toOrderItemResponse(OrderItem orderItem);
}

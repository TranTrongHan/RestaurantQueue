package com.tth.RestaurantApplication.mapper;

import com.tth.RestaurantApplication.dto.response.KitchenAssignmentResponse;
import com.tth.RestaurantApplication.entity.Chef;
import com.tth.RestaurantApplication.entity.KitchenAssignment;
import com.tth.RestaurantApplication.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring",uses = {ChefMapper.class, OrderItemMapper.class})
public interface KitchenAssignmentMapper {


    @Mapping(source = "chef",target = "chefResponse")
    @Mapping(source = "orderItem",target = "itemResponse")
    @Mapping(source = "orderItem.order.orderSession.reservation.table.tableName",target = "table")
    KitchenAssignmentResponse toKitchenAssignmentResponse(KitchenAssignment assignment);

    default Integer toChefId(Chef chef) {
        return chef != null ? chef.getUserId() : null;
    }

    // Viết tương tự cho OrderItem
    default Integer toOrderItemId(OrderItem orderItem) {
        return orderItem != null ? orderItem.getOrderItemId() : null;
    }
}

package com.tth.RestaurantApplication.dto.response;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    Integer orderId;
    List<OrderItemResponse> items;
    LocalDateTime createdAt;
    Boolean isPaid;
}

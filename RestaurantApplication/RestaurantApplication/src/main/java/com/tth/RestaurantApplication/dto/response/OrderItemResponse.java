package com.tth.RestaurantApplication.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.tth.RestaurantApplication.entity.OrderItem;
import jakarta.persistence.Column;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

public class OrderItemResponse {
    Integer orderItemId;
    Integer orderId;
    Integer quantity;
    OrderItem.OrderItemStatus orderItemStatus;
    String name;
    BigDecimal price;
    String image;
    Integer  estimateTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime startTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime expectedDeadlineTime;
    String note = null;
    Double priorityScore;
}

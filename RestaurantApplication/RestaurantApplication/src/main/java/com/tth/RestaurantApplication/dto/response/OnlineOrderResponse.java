package com.tth.RestaurantApplication.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OnlineOrderResponse {
    Integer onlineOrderId;
    Integer orderId;
    List<OrderItemResponse> orderItems;
    CustomerResponse  customer;
    String deliveryAddress;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    Date createdAt;
    String note = null;
}

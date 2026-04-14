package com.tth.RestaurantApplication.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomerOrderHistoryResponse {
    Integer orderId;
    OrderType orderType;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime createdAt;
    
    Boolean isPaid;
    BigDecimal subTotal;
    BigDecimal discountAmount;
    BigDecimal totalAmount;
    String status;
    
    List<OrderItemResponse> items;
    Map<String, String> metadata; // e.g., deliveryAddress, tableName, reservationId

    public enum OrderType {
        ONLINE, DINE_IN
    }
}

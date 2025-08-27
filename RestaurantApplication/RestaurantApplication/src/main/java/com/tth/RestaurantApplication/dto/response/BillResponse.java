package com.tth.RestaurantApplication.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.tth.RestaurantApplication.entity.Bill;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BillResponse {
    Integer billId;
    OrderResponse order;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime createdAt;
    BigDecimal subTotal;
    BigDecimal discountAmount;
    BigDecimal totalAmount;
    Bill.BillStatus status;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime paymentTime;
}

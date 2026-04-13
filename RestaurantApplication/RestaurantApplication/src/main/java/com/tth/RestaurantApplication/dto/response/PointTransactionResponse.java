package com.tth.RestaurantApplication.dto.response;

import com.tth.RestaurantApplication.entity.PointTransaction;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PointTransactionResponse {
    Integer id;
    Integer basePoints;
    Integer bonusPoints;
    Integer amount;
    PointTransaction.PointTransactionType transactionType;
    String description;
    Integer billId;
    LocalDateTime createdAt;
}

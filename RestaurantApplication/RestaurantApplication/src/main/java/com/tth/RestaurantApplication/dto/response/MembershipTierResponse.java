package com.tth.RestaurantApplication.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MembershipTierResponse {
    Integer id;
    String tierName;
    BigDecimal minSpending;
    Double pointEarningRate;
    String description;
}

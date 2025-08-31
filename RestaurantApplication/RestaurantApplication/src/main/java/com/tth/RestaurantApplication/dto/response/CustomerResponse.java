package com.tth.RestaurantApplication.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomerResponse {
    Integer userId;
    String fullName;
    String email;
    String phone;
    Boolean isVip;
}

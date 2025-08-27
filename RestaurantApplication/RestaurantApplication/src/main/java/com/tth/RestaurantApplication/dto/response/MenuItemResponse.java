package com.tth.RestaurantApplication.dto.response;


import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MenuItemResponse {
    Integer menuItemId;
    String name;
    String image;
    BigDecimal price;
    Boolean isAvailable;
    Double avgCookingTime;
    Double baseCookingTime;
}

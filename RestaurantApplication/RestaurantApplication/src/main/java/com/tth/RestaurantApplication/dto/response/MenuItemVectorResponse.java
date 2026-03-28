package com.tth.RestaurantApplication.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MenuItemVectorResponse {
    Integer menuItemId;
    String name;
    String image;
    BigDecimal price;
    String description;

    public MenuItemVectorResponse(Integer menuItemId, String name, String image, BigDecimal price, String description) {
        this.menuItemId = menuItemId;
        this.name = name;
        this.image = image;
        this.price = price;
        this.description = description;
    }

}

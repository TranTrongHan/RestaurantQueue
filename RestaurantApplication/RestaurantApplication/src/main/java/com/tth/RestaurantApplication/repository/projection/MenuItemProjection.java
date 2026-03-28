package com.tth.RestaurantApplication.repository.projection;

import java.math.BigDecimal;

public interface MenuItemProjection {
    Integer getId();
    String getName();
    BigDecimal getPrice();
    String getImage();
    String getDescription();
}

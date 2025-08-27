package com.tth.RestaurantApplication.dto.request;

import lombok.Data;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Data
public class CartItemRequest {
    
    @NotNull(message = "Menu item ID cannot be null")
    private Integer menuItemId;
    
    @NotNull(message = "Quantity cannot be null")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
